// rebook-auth-service/workers/relayWorker.js
const amqp = require('amqplib');
const cron = require('node-cron');
const Outbox = require('../models/Outbox');

async function startRelay() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    
    const QUEUE = 'user_events';
    const DLQ = 'user_events_dead_letter'; // <--- Add this

    // <--- Update this entire section to match the Monolith --->
    await channel.assertQueue(DLQ, { durable: true });
    await channel.assertQueue(QUEUE, { 
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: DLQ 
    });
    // <------------------------------------------------------->

    // Run every 5 seconds to sweep the Outbox
    cron.schedule('*/5 * * * * *', async () => {
        const pendingEvents = await Outbox.find({ status: 'PENDING' }).limit(50);
        
        for (const event of pendingEvents) {
            try {
                // 1. Publish to RabbitMQ
                const message = JSON.stringify({ id: event._id, type: event.eventType, payload: event.payload });
                channel.sendToQueue(QUEUE, Buffer.from(message), { persistent: true });

                // 2. Mark as processed
                event.status = 'PROCESSED';
                await event.save();
                
                console.log(`📤 Relay Worker published event: ${event._id}`); // <--- Add a log so you can see it work
                
            } catch (err) {
                console.error('Failed to publish event:', err);
                event.retries += 1;
                if(event.retries > 3) event.status = 'FAILED';
                await event.save();
            }
        }
    });
}

module.exports = startRelay;