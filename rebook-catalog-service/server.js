// rebook-catalog-service/server.js
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
    .then(() => console.log('📦 Catalog Service connected to MongoDB'))
    .catch(err => console.log(err));

// Mount the Book Routes
const bookRoutes = require('./routes/bookRoutes');
app.use('/api/books', bookRoutes);

// Start Service
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
    console.log(`📚 ReBook Catalog Microservice running smoothly on Port ${PORT}`);
});