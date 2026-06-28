// rebook-message-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to Database (This service gets its own MongoDB connection)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('📨 Message Service connected to MongoDB'))
    .catch(err => console.error("Database Connection Error:", err));

// 2. Mount Routes at the root
const messageRoutes = require('./routes/messageRoutes');
app.use('/', messageRoutes);

// 3. Start Server
const PORT = process.env.PORT || 4005;
app.listen(PORT, () => {
    console.log(`📨 ReBook Message Microservice running on Port ${PORT}`);
});