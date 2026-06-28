// rebook-cart-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const redis = require('redis');
const axios = require('axios'); // For inter-service communication

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to Redis
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.connect()
    .then(() => console.log('🛒 Cart Service connected to Redis'))
    .catch(err => console.error('Redis Error:', err));

// The address of our new Catalog Microservice
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4003';

// --- 🛑 ROUTE: ADD TO CART ---
app.post('/add', async (req, res) => {
    try {
        const { userId, bookId } = req.body;
        const cartKey = `cart:${userId}`;

        // Add bookId to a Redis Set (sAdd automatically prevents duplicates!)
        await redisClient.sAdd(cartKey, bookId);
        
        // Set the cart to expire and self-delete after 24 hours (86400 seconds)
        await redisClient.expire(cartKey, 86400);

        res.json({ message: 'Book securely added to temporary cart' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// --- 🌐 ROUTE: VIEW CART (Inter-Service Communication) ---
app.get('/:userId', async (req, res) => {
    try {
        const cartKey = `cart:${req.params.userId}`;
        
        // 1. Fetch the list of Book IDs from Redis
        const bookIds = await redisClient.sMembers(cartKey);

        if (!bookIds || bookIds.length === 0) {
            return res.json({ cart: [] });
        }

        console.log(`🌐 Reaching out to Catalog Service over the network for ${bookIds.length} books...`);
        
        // 2. THE INTER-SERVICE CALL: Ask the Catalog Service for the details
        // We use Promise.all to fetch them all concurrently for maximum speed
        const bookDetailsPromises = bookIds.map(id => 
            axios.get(`${CATALOG_SERVICE_URL}/api/books/${id}`)
                 .then(response => response.data)
                 .catch(err => null) // If a book was deleted by the seller, ignore it
        );

        // 3. Filter out any nulls (deleted books) and return the fully populated cart
        const populatedCart = (await Promise.all(bookDetailsPromises)).filter(book => book !== null);

        res.json({ cart: populatedCart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// --- 🧹 ROUTE: CLEAR CART ---
app.delete('/:userId', async (req, res) => {
    await redisClient.del(`cart:${req.params.userId}`);
    res.json({ message: 'Cart cleared successfully' });
});

// --- 🗑️ ROUTE: REMOVE SINGLE ITEM FROM CART ---
app.post('/remove', async (req, res) => {
    try {
        const { userId, bookId } = req.body;
        const cartKey = `cart:${userId}`;

        // sRem removes a specific value from the Redis Set
        await redisClient.sRem(cartKey, bookId);

        res.json({ message: 'Book removed from cart' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});
const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
    console.log(`🛒 ReBook Cart Microservice running on Port ${PORT}`);
});