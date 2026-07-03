// rebook-message-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { requestLogger, logger } = require('./config/logger'); // 🚨 Import Logger

const app = express();
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://rebook-gamma.vercel.app" // Keep this for when you deploy!
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(requestLogger);
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
    logger.info(`📦 Rebook message Service running on ${PORT}`);
    
});