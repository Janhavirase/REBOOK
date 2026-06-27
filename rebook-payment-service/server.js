require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const amqp = require('amqplib');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

        const order = await razorpay.orders.create(options);
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
});