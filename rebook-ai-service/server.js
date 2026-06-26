// rebook-ai-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// 1. Middleware
app.use(cors());
app.use(express.json()); // The microservice MUST parse the JSON body

// 2. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
        const result = await model.generateContent(prompt);
        const text = result.response.text();
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
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
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
        const result = await model.generateContent(prompt);
        const text = result.response.text();
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
});