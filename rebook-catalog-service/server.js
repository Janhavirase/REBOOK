// rebook-catalog-service/server.js
const { consumePaymentEvents } = require('./workers/paymentWorker');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import your existing Redis connection
require('./config/redis'); 

const app = express();
app.use(cors());
app.use(express.json());

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
});