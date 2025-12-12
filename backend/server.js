// 1. Load env variables immediately
require('dotenv').config(); 
const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db'); // Your db connection file
const bookRoutes = require('./routes/bookRoutes');
const messageRoutes = require('./routes/messageRoutes'); // Import
const aiRoutes = require('./routes/aiRoutes'); // <--- Import
// ... rest of your imports
const userRoutes = require('./routes/userRoutes')
const app = express();

// 2. Connect to Database (This function will now look for process.env.MONGO_URI)
connectDB(); 
// <--- 2. USE THIS MIDDLEWARE (Allow Frontend to talk to Backend)
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/messages', messageRoutes); // Mount it
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));