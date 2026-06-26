// rebook-backend/workers/userEventsConsumer.js
const amqp = require('amqplib');
const Book = require('../models/Book');     // <-- Note the ../
const Review = require('../models/Review'); // <-- Note the ../

const processedEvents = new Set(); 

async function startConsumer() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        
        const QUEUE = 'user_events';
        const DLQ = 'user_events_dead_letter';

        await channel.assertQueue(DLQ, { durable: true });
        await channel.assertQueue(QUEUE, { 
            durable: true,
            deadLetterExchange: '',
            deadLetterRoutingKey: DLQ 
        });

        console.log("🎧 Monolith listening for events on RabbitMQ...");

        channel.consume(QUEUE, async (msg) => {
            if (msg !== null) {
                const event = JSON.parse(msg.content.toString());

                if (processedEvents.has(event.id)) {
                    console.log(`Skipping duplicate event: ${event.id}`);
                    return channel.ack(msg);
                }

                try {
                    if (event.type === 'USER_DELETED') {
                        const { userId } = event.payload;
                        
                        await Book.deleteMany({ seller: userId });
                        await Review.deleteMany({ targetUser: userId });
                        
                        console.log(`Cascade cleanup complete for user: ${userId}`);
                    }

                    processedEvents.add(event.id);
                    channel.ack(msg);

                } catch (err) {
                    console.error("Error processing event, sending to DLQ:", err);
                    channel.reject(msg, false); 
                }
            }
        });
    } catch (error) {
        console.error("RabbitMQ Connection Error in Monolith:", error.message);
    }
}

// Export it so server.js can start it
module.exports = startConsumer;