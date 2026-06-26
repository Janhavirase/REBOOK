// rebook-auth-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Outbox = require('./models/Outbox');
const relay=require('./workers/relayWorker');

// 🚨 NEW: Import Joi Validation Middleware & Schemas
const validateRequest = require('./middlewares/validateRequest');
const { registerSchema, loginSchema } = require('./validation/authSchemas');

const app = express();
app.use(cors());
app.use(express.json()); // Essential for reading login/register data

// 1. Connect to Database independently
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('📦 Auth Service connected to MongoDB'))
    .catch(err => console.log(err));

// 2. Define the exact User Schema you provided
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }, 
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// 3. Helper Function
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 4. Extract controllers (Exactly as you wrote them)
// 🚨 NEW: Injected validateRequest(registerSchema) middleware
app.post('/register', validateRequest(registerSchema), async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password || !phone) return res.status(400).json({ message: 'Please add all fields including Phone Number' });

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({ name, email, phone, password: hashedPassword });

        if (user) {
            res.status(201).json({
                _id: user._id, name: user.name, email: user.email, phone: user.phone, token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

// 🚨 NEW: Injected validateRequest(loginSchema) middleware
app.post('/login', validateRequest(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
          console.log("User found:", user ? user.email : "No user found");
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin, token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

app.delete('/:id', async (req, res) => {    // 1. Start a database session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.params.id;

        // 2. Delete the user (Pass the session)
        await User.findByIdAndDelete(userId).session(session);

        // 3. Write to the Outbox (Pass the session)
        await Outbox.create([{
            eventType: 'USER_DELETED',
            payload: { userId: userId, deletedAt: new Date() }
        }], { session });

        // 4. Commit BOTH actions together safely
        await session.commitTransaction();
        res.json({ message: 'User safely removed and event staged.' });

    } catch (error) {
        // If anything fails, undo everything
        await session.abortTransaction();
        res.status(500).json({ message: 'Transaction failed, rolled back.' });
    } finally {
        session.endSession();
    }
});

// 5. Start Service
const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
    console.log(`🔐 ReBook Auth Microservice safely running on Port ${PORT}`);
});

relay();