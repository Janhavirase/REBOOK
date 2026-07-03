require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const amqp = require('amqplib');
const CircuitBreaker = require('opossum'); // 🚨 NEW: Import Opossum
const { requestLogger, logger } = require('./config/logger'); // 🚨 Import Logger

const app = express();
app.use(requestLogger);
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://rebook-gamma.vercel.app" // Keep for production!
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🚨 NEW: Configure Circuit Breaker Options for Financial Transactions
const paymentBreakerOptions = {
    timeout: 5000,                // Timeout after 5 seconds if Razorpay hangs
    errorThresholdPercentage: 40,  // Trip breaker if 40% of recent transactions fail
    resetTimeout: 15000           // Stay open for 15 seconds before cooldown check
};

// 🚨 NEW: Wrap the outgoing Razorpay API call in a function
const executeRazorpayOrderCreation = async (options) => {
    return await razorpay.orders.create(options);
};

// 🚨 NEW: Instantiate the Circuit Breaker
const paymentBreaker = new CircuitBreaker(executeRazorpayOrderCreation, paymentBreakerOptions);

// 🚨 NEW: Define the Fallback Strategy when the breaker trips (OPEN)
paymentBreaker.fallback((err) => {
    console.error("🚨 Payment Circuit Breaker is OPEN! Falling back safely.");
    return {
        isFallback: true,
        message: "Our secure payment partner is experiencing heavy load. No funds were deducted. Please retry shortly."
    };
});

// Operational Telemetry Logs for debugging system stability
paymentBreaker.on('open', () => console.warn('⚠️ PAYMENT BREAKER TRIPPED: State is now OPEN.'));
paymentBreaker.on('close', () => console.log('✅ PAYMENT BREAKER RESTORED: State is now CLOSED.'));
paymentBreaker.on('halfOpen', () => console.log('🟡 PAYMENT BREAKER TESTING: State is HALF-OPEN.'));

// RabbitMQ Publisher Helper
async function publishToQueue(queueName, data) {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue(queueName, { durable: true });
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
        setTimeout(() => connection.close(), 500);
    } catch (error) {
        console.error("RabbitMQ Publish Error:", error);
    }
}

// 1. Create Order Route (Frontend calls this before showing the Razorpay popup)
app.post('/create-order', async (req, res) => {
    try {
        const { amount, bookId, buyerId } = req.body;

        const options = {
            amount: amount * 100, // Razorpay expects paise, not rupees!
            currency: "INR",
            receipt: `receipt_book_${bookId}`,
            notes: { bookId, buyerId } // Store IDs here so the webhook can read them later
        };

        // 🚨 UPDATED: Execute the external call through the circuit breaker fire mechanism
        const order = await paymentBreaker.fire(options);

        // Check if the circuit breaker tripped and executed the fallback object
        if (order && order.isFallback) {
            return res.status(503).json({ 
                message: order.message,
                code: "PAYMENT_GATEWAY_TIMEOUT"
            });
        }

        res.json(order);
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ message: 'Error creating order' });
    }
});

// 2. The Secure Webhook Route (Razorpay calls this when payment succeeds)
app.post('/webhook', (req, res) => {
    // Webhooks MUST be verified to prevent hackers from faking payments
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature === signature) {
        console.log("✅ Webhook verified successfully!");
        
        const paymentData = req.body.payload.payment.entity;
        
        if (paymentData.status === 'captured') {
            const { bookId, buyerId } = paymentData.notes;
            
            // 🔥 SENIOR ENGINEER MOVE: Fire the RabbitMQ Event!
            publishToQueue('PAYMENT_SUCCESS', {
                bookId,
                buyerId,
                amount: paymentData.amount / 100,
                timestamp: new Date()
            });
            console.log(`📢 Broadcasted PAYMENT_SUCCESS for Book: ${bookId}`);
        }
        res.status(200).send('OK');
    } else {
        console.error("🚨 Invalid Webhook Signature!");
        res.status(400).send('Invalid Signature');
    }
});

app.listen(process.env.PORT || 4006, () => {
    console.log(`💳 Payment Microservice running on Port ${process.env.PORT || 4006}`);
    logger.info(`📦 Rebook payment Service running on ${process.env.PORT||4006}`);
    
});