// rebook-backend/middleware/cacheMiddleware.js
const redisClient = require('../config/redis');

const cacheBooks = async (req, res, next) => {
    // We create a unique key based on the exact URL (e.g., "books:/api/books?page=1&limit=10")
    let key = `books:${req.originalUrl}`;
    if (req.query.lat && req.query.lng) {
        const roundedLat = parseFloat(req.query.lat).toFixed(2);
        const roundedLng = parseFloat(req.query.lng).toFixed(2);
        
        // Overwrite the key with the rounded values
        key = `books:/api/books?lat=${roundedLat}&lng=${roundedLng}`;
    }

    try {
        const cachedData = await redisClient.get(key);
        
        if (cachedData) {
            console.log(`🚀 REDIS CACHE HIT: Served ${key} from RAM in <2ms!`);
            return res.json(JSON.parse(cachedData));
        }

        console.log(`🐢 REDIS CACHE MISS: Fetching ${key} from MongoDB...`);
        // If not in cache, attach the key to the request so the controller can save it later
        req.redisKey = key; 
        next();

    } catch (error) {
        console.error('Redis Cache Error:', error);
        next(); // If Redis crashes, don't break the app—just fallback to MongoDB
    }
};

module.exports = cacheBooks;