const redis = require('redis');

// It MUST use process.env.REDIS_URL first, falling back to localhost only for local dev
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect()
    .then(() => console.log('📚 Catalog Service connected to Redis'))
    .catch(console.error);

module.exports = redisClient;