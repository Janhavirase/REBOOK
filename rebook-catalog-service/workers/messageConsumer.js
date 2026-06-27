// rebook-catalog-service/workers/messageConsumer.js
const amqp = require('amqplib');
const Book = require('../models/Book');

const listenForEvents = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        const channel = await connection.createChannel();
        
        // We connect to the exact same exchange the Auth service broadcasts to
        const exchange = 'user_events';
        await channel.assertExchange(exchange, 'fanout', { durable: true });

        // Create a dedicated queue just for the Catalog service
        const q = await channel.assertQueue('catalog_service_queue', { exclusive: false });
        await channel.bindQueue(q.queue, exchange, '');

        console.log('🎧 Catalog Service listening for events on RabbitMQ...');

        channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                const parsedMessage = JSON.parse(msg.content.toString());
                
                if (parsedMessage.eventType === 'USER_DELETED') {
                    const deletedUserId = parsedMessage.payload.userId;
                    
                    // 🚨 The Catalog Service now correctly deletes its own orphaned data
                    const result = await Book.deleteMany({ seller: deletedUserId });
                    console.log(`🧹 Catalog Cleanup: Deleted ${result.deletedCount} books for removed user ${deletedUserId}`);
                }
                
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('RabbitMQ Connection Failed in Catalog Service:', error);
    }
};

module.exports = listenForEvents;