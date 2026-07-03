// rebook-catalog-service/server.js
const { consumePaymentEvents } = require('./workers/paymentWorker');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { requestLogger, logger } = require('./config/logger'); // 🚨 Import Logger

// Import your existing Redis connection
require('./config/redis'); 

const app = express();
app.use(requestLogger);
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://rebook-gamma.vercel.app" // Keep this ready for deployment!
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));app.use(express.json());

// Connect to Database
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('📦 Catalog Service connected to MongoDB');
        
        // 3. START CONSUMER HERE: Ensures DB is ready before RabbitMQ starts listening
        await consumePaymentEvents(); 
    })
    .catch(err => console.error("Database Connection Error:", err));

// Mount the Book Routes
const bookRoutes = require('./routes/bookRoutes');
app.use('/', bookRoutes);



const listenForEvents = require('./workers/messageConsumer');
listenForEvents();
// Start Service
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
    console.log(`📚 ReBook Catalog Microservice running smoothly on Port ${PORT}`);
    logger.info(`📦 Catalog Service running on ${PORT}`);
});