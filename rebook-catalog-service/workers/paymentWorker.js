const amqp = require('amqplib');
const Book = require('../models/book');

async function consumePaymentEvents() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        const channel = await connection.createChannel();
        await channel.assertQueue('PAYMENT_SUCCESS', { durable: true });

        console.log("🎧 Catalog Service listening for PAYMENT_SUCCESS events...");

        channel.consume('PAYMENT_SUCCESS', async (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                console.log("💰 Payment received! Removing book from marketplace:", data.bookId);

                // Update the database to hide the book
                await Book.findByIdAndUpdate(data.bookId, { 
                    // Assuming you have an isAvailable flag, or just delete it/move it to a "sold" state
                    status: 'Sold' // or isAvailable: false
                });

                channel.ack(msg); // Tell RabbitMQ we successfully processed it
            }
        });
    } catch (error) {
        console.error("RabbitMQ Consumer Error:", error);
    }
}
module.exports = { consumePaymentEvents };