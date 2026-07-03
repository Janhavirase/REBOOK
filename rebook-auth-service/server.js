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
const relay = require('./workers/relayWorker');
const { requestLogger, logger } = require('./config/logger'); // 🚨 Import Logger

// 🚨 NEW: Import cookie-parser for secure HTTP-Only cookies
const cookieParser = require('cookie-parser'); 

// 🚨 NEW: Import Joi Validation Middleware & Schemas
const validateRequest = require('./middlewares/validateRequest');
const { registerSchema, loginSchema } = require('./validation/authSchemas');

// 🚨 NEW: Import Opossum for Circuit Breaking
const CircuitBreaker = require('opossum'); 

const breakerOptions = {
    timeout: 3000,               // If a request takes longer than 3 seconds, count it as a failure
    errorThresholdPercentage: 50, // If 50% of requests fail, trip the breaker (OPEN)
    resetTimeout: 10000          // Wait 10 seconds before trying again (HALF-OPEN)
};

const app = express();
app.use(requestLogger);

// 🚨 UPDATED CORS: We must allow credentials so the browser sends the secure cookie
app.use(cors({
    origin: ["http://localhost:5173", "https://rebook-gamma.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json()); // Essential for reading login/register data
app.use(cookieParser()); // 🚨 NEW: Required to read the refresh token cookie

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
    }],
    // 🚨 NEW: Array to store active refresh tokens for the user
    refreshTokens: { type: [String], default: [] } 
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// 3. Helper Functions (UPDATED FOR ROTATION)
// 🚨 TIME TRAVEL TEST ACTIVATED: Expires in 10 seconds! 🚨
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' }); // <-- Change back to '15m' later
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// 4. Extract controllers (Exactly as you wrote them, with cookie logic added)
app.post('/register', validateRequest(registerSchema), async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password || !phone) return res.status(400).json({ message: 'Please add all fields including Phone Number' });

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate the long-lived refresh token
        const newRefreshToken = generateRefreshToken(email); // Or user ID

        // 🚨 Save it to the database
        const user = await User.create({ 
            name, email, phone, password: hashedPassword, refreshTokens: [newRefreshToken] 
        });

        if (user) {
            // 🚨 Set the secure HTTP-Only cookie
            res.cookie('jwt', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'None',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(201).json({
                _id: user._id, name: user.name, email: user.email, phone: user.phone, 
                token: generateAccessToken(user._id), // Send the 10-second token
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

app.post('/login', validateRequest(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        console.log("User found:", user ? user.email : "No user found");
        
        if (user && (await bcrypt.compare(password, user.password))) {
            
            const newRefreshToken = generateRefreshToken(user._id);
            
            // 🚨 Add the new token to the array and save
            user.refreshTokens.push(newRefreshToken);
            await user.save();

            // 🚨 Bake the secure cookie
            res.cookie('jwt', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'None',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                _id: user._id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin, 
                token: generateAccessToken(user._id), // Send the 10-second token
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

// 🚨 NEW ROUTE: The Refresh Interceptor Target 🚨
app.get('/api/users/refresh', async (req, res) => { // Path updated to match frontend call
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });
    
    const refreshToken = cookies.jwt;
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: process.env.NODE_ENV === 'production' });

    const foundUser = await User.findOne({ refreshTokens: refreshToken });

    // Reuse detection!
    if (!foundUser) {
        jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' });
            console.log("⚠️ Token reuse detected! Wiping grants.");
            await User.findByIdAndUpdate(decoded.id, { refreshTokens: [] });
        });
        return res.status(403).json({ message: 'Forbidden' });
    }

    const newRefreshTokenArray = foundUser.refreshTokens.filter(rt => rt !== refreshToken);

    jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            foundUser.refreshTokens = [...newRefreshTokenArray];
            await foundUser.save();
            return res.status(403).json({ message: 'Forbidden' });
        }

        const newRefreshToken = generateRefreshToken(foundUser._id);
        foundUser.refreshTokens = [...newRefreshTokenArray, newRefreshToken];
        await foundUser.save();

        res.cookie('jwt', newRefreshToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'None', maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ token: generateAccessToken(foundUser._id) });
    });
});

// --- NEW ROUTE: Get Public Profile ---

// --- 🚨 CIRCUIT BREAKER SETUP FOR CATALOG CALL ---
const fetchSellerBooks = async (sellerId) => {
    const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4003';
    const response = await axios.get(`${CATALOG_URL}/seller/${sellerId}`);
    return response.data;
};

const catalogBreaker = new CircuitBreaker(fetchSellerBooks, breakerOptions);

catalogBreaker.fallback(() => {
    console.warn("⚠️ Catalog Breaker OPEN: Failing fast, returning empty books.");
    return []; 
});

catalogBreaker.on('open', () => console.log('🔴 Circuit Breaker Tripped! (OPEN)'));
catalogBreaker.on('halfOpen', () => console.log('🟡 Testing Catalog Service... (HALF-OPEN)'));
catalogBreaker.on('close', () => console.log('🟢 Catalog Service Restored. (CLOSED)'));
// ------------------------------------------------

// --- MICROSERVICE AGGREGATOR: Get Public Profile ---
app.get('/profile/:id', async (req, res) => {
    try {
        // Validation check so bad IDs don't crash the server!
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid User ID format' });
        }

        // 1. Fetch the User from the Auth Database
        const user = await User.findById(req.params.id).select('-password -cart');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Fetch the Books from the Catalog Microservice using Circuit Breaker!
        let books = [];
        try {
            // Using Opossum Breaker to fire the request
            books = await catalogBreaker.fire(req.params.id);
        } catch (bookError) {
            console.error("⚠️ Catalog Service unreachable. Loading profile without books.");
            // We don't crash the server here, we just return an empty array for books so the profile still loads!
        }

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
app.get(['/', '/api/users', '/users'], protect, admin, async (req, res) => {
    try {
        // Safe query: We select('-password') to never accidentally send password hashes to the dashboard
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
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

app.delete(['/:id', '/api/users/:id'], protect, admin, async (req, res) => { 
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.params.id;

        // Delete the user (Pass the session)
        await User.findByIdAndDelete(userId).session(session);

        // Write to the Outbox (Pass the session)
        await Outbox.create([{
            eventType: 'USER_DELETED',
            payload: { userId: userId, deletedAt: new Date() }
        }], { session });

        // Commit BOTH actions together safely
        await session.commitTransaction();
        res.json({ message: 'User safely removed and event staged.' });

    } catch (error) {
        // If anything fails, undo everything
        await session.abortTransaction();
        console.error("Transaction failed:", error);
        res.status(500).json({ message: 'Transaction failed, rolled back.' });
    } finally {
        session.endSession();
    }
});

// 5. Start Service
const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
    console.log(`🔐 ReBook Auth Microservice safely running on Port ${PORT}`);
    logger.info(`📦 Rebook Auth Service running on ${PORT}`);
});

relay();