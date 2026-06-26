// rebook-backend/config/redis.js
const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('❌ Redis Error:', err));
redisClient.on('connect', () => console.log('⚡ Redis smoothly connected to Port 6379'));

// Establish the connection
redisClient.connect().catch(console.error);

module.exports = redisClient;