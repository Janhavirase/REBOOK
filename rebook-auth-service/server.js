// rebook-auth-service/server.js
const axios = require('axios');
const Review = require('./models/Review');
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

// --- NEW ROUTE: Get Public Profile ---

// --- MICROSERVICE AGGREGATOR: Get Public Profile ---
app.get('/profile/:id', async (req, res) => {
    try {
        // 1. Fetch the User from the Auth Database
        const user = await User.findById(req.params.id).select('-password -cart');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Fetch the Books from the Catalog Microservice (Network Join)
        let books = [];
        try {
            // The Auth service internally calls the Catalog service on Port 4003
            const bookResponse = await axios.get(`http://localhost:4003/seller/${req.params.id}`);
            books = bookResponse.data;
        } catch (bookError) {
            console.error("⚠️ Catalog Service unreachable. Loading profile without books.");
            // We don't crash the server here, we just return an empty array for books so the profile still loads!
        }

        // 3. Fetch the Reviews (Apply the exact same pattern!)
      // 3. Fetch the Reviews (Direct DB call with population)
        let reviews = [];
        try {
            reviews = await Review.find({ targetUser: req.params.id })
                                  .populate('reviewer', 'name')
                                  .sort({ createdAt: -1 });
        } catch (reviewErr) {
            console.error("Error fetching reviews:", reviewErr);
        }

        // 4. Send the combined "Monolith-Style" response back to the React Frontend
        res.json({ user, books, reviews });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: 'Server Error fetching profile' });
    }
});

// --- SUBMIT REVIEW ROUTE ---
// --- JWT PROTECTION MIDDLEWARE ---
const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Extract the token from the header
            token = req.headers.authorization.split(' ')[1];
            
            // 2. Decode the token using your secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 3. Find the user in the database and attach to req.user
            req.user = await User.findById(decoded.id).select('-password');
            
            // 🚨 CRITICAL: Pass the baton to the next function so it doesn't 504!
            return next(); 
        } catch (error) {
            console.error("Token verification failed:", error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Add this middleware right below your `protect` middleware in auth-service
const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

// Add the missing Admin route
app.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching users' });
    }
});

// IMPORTANT: Adjust the path ('/:id/reviews' or '/profile/:id/reviews') to match your React Axios call perfectly.
app.post('/:id/reviews', protect, async (req, res) => {
  const { rating, comment } = req.body;
  const sellerId = req.params.id;

  try {
    // 1. Check for self-review
    if (req.user._id.toString() === sellerId) {
        return res.status(400).json({ message: 'You cannot review yourself' });
    }

    // 2. Check for duplicate review
    const alreadyReviewed = await Review.findOne({ reviewer: req.user._id, targetUser: sellerId });
    if (alreadyReviewed) {
        return res.status(400).json({ message: 'You already reviewed this seller' });
    }

    // 3. Create the review
    await Review.create({
        reviewer: req.user._id,
        targetUser: sellerId,
        rating: Number(rating),
        comment
    });

    res.status(201).json({ message: 'Review Added' });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: 'Server Error adding review' });
  }
});

app.delete('/:id', protect, admin, async (req, res) => {    const session = await mongoose.startSession();
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