// rebook-ai-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const CircuitBreaker = require('opossum'); // 🚨 NEW: Import Opossum
const { requestLogger, logger } = require('./config/logger'); // 🚨 Import Logger

const app = express();

// 1. Middleware
app.use(requestLogger);
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://rebook-gamma.vercel.app" // Keep for production!
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json()); // The microservice MUST parse the JSON body

// 2. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 🚨 NEW: Configure AI Breaker Options
const aiBreakerOptions = {
    timeout: 8000,                // Timeout after 8 seconds 
    errorThresholdPercentage: 50, // Trip if 50% of requests fail
    resetTimeout: 30000           // Wait 30 seconds before trying again (AI outages usually last longer)
};

// 🚨 NEW: Breaker Functions and Fallbacks
// --- Description Breaker ---
const executeDescriptionAI = async (prompt) => {
    const result = await model.generateContent(prompt);
    return result.response.text();
};
const descriptionBreaker = new CircuitBreaker(executeDescriptionAI, aiBreakerOptions);
descriptionBreaker.fallback(() => {
    console.warn("⚠️ AI Description Breaker OPEN: Returning safe manual fallback.");
    return "AI generation is currently experiencing high demand. Please write a brief manual description for your book.";
});

// --- Price Breaker ---
const executePriceAI = async (prompt) => {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
};
const priceBreaker = new CircuitBreaker(executePriceAI, aiBreakerOptions);
priceBreaker.fallback(() => {
    console.warn("⚠️ AI Price Breaker OPEN: Returning safe manual fallback.");
    return "Market data temporarily unavailable.";
});

// --- Chat Breaker ---
const executeChatAI = async (prompt) => {
    const result = await model.generateContent(prompt);
    return result.response.text();
};
const chatBreaker = new CircuitBreaker(executeChatAI, aiBreakerOptions);
chatBreaker.fallback(() => {
    console.warn("⚠️ AI Chat Breaker OPEN: Returning safe manual fallback.");
    return "Genie is taking a quick nap! 💤 Please try again in a minute.";
});

// Telemetry Logs for visibility in your Render terminal
descriptionBreaker.on('open', () => console.warn('🔴 AI DESC LINE TRIPPED (OPEN)'));
descriptionBreaker.on('close', () => console.log('🟢 AI DESC LINE RESTORED (CLOSED)'));
priceBreaker.on('open', () => console.warn('🔴 AI PRICE LINE TRIPPED (OPEN)'));
priceBreaker.on('close', () => console.log('🟢 AI PRICE LINE RESTORED (CLOSED)'));
chatBreaker.on('open', () => console.warn('🔴 AI CHAT LINE TRIPPED (OPEN)'));
chatBreaker.on('close', () => console.log('🟢 AI CHAT LINE RESTORED (CLOSED)'));

// 3. Define the AI Routes (Copied exactly from your Monolith)
const aiRouter = express.Router();

aiRouter.post('/generate-description', async (req, res) => {
    const { title, author, condition, category } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    try {
        const prompt = `
            Write a short, engaging sales description (max 3 sentences) for a used book.
            Details: Title: "${title}", Author: "${author}", Condition: "${condition}", Category: "${category}".
            Tone: Helpful and persuasive.
        `;
        // 🚨 UPDATED: Fire the request through the Circuit Breaker
        const text = await descriptionBreaker.fire(prompt);
        res.json({ description: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: "AI generation failed" });
    }
});

aiRouter.post('/estimate-price', async (req, res) => {
    const { title, author, condition } = req.body;
    try {
        const prompt = `
            Estimate a fair secondhand selling price range in Indian Rupees (₹) for:
            Book: "${title}" by ${author}. Condition: ${condition}.
            Output strictly in this format: "₹200 - ₹300". Do not add any extra text.
        `;
        // 🚨 UPDATED: Fire the request through the Circuit Breaker
        const text = await priceBreaker.fire(prompt);
        res.json({ priceRange: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: "Could not estimate price" });
    }
});

aiRouter.post('/chat', async (req, res) => {
    const { message } = req.body;
    try {
        const prompt = `
            You are 'Genie', the AI support agent for ReBook (a book marketplace).
            User asked: "${message}"
            Keep answers short (under 20 words), friendly, and use emojis. 
            If they ask to buy/sell, guide them to the respective buttons.
        `;
        // 🚨 UPDATED: Fire the request through the Circuit Breaker
        const text = await chatBreaker.fire(prompt);
        res.json({ reply: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: "I'm having trouble thinking right now." });
    }
});

// 4. Mount the routes to perfectly match the proxy forward
app.use('/', aiRouter);

// 5. Start the Microservice
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
    console.log(`🧠 ReBook AI Microservice running safely on Port ${PORT}`);
        logger.info(`📦 Rebook AI Service running on ${PORT}`);
    
});