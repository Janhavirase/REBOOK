require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit'); // 🚨 NEW: Import the limiter
const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://rebook-xi.vercel.app" 
    ],
    credentials: true
}));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        service: 'ReBook API Gateway',
        timestamp: new Date().toISOString()
    });
});

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { 
        error: 'Too many requests from this IP. Please try again after 15 minutes.' 
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', globalLimiter);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:4001'; // <--- ADD THIS LINE
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const MONOLITH_URL = process.env.MONOLITH_URL || 'http://localhost:5000';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4003';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:4004';
// 1. AI SERVICE ROUTE
app.use('/api/ai', createProxyMiddleware({
    target: AI_SERVICE_URL,
    changeOrigin: true,
    logger: console
}));

// 2. THE OPTION A SPLIT (Auth Interception)
// The gateway mounts at /api/users, so req.path becomes just '/login' or '/cart'
// 2. THE OPTION A SPLIT (Auth Interception)
// app.use('/api/users', (req, res, next) => {
//     // If it is Login, Register, OR a DELETE request -> Send to Auth Service (4002)
//     if (req.path === '/login' || req.path === '/register' || req.method === 'DELETE') {
//         return createProxyMiddleware({
//             target: AUTH_SERVICE_URL,
//             changeOrigin: true,
//             logger: console
//         })(req, res, next);
//     }
//     // If it's anything else (/cart, /profile), skip this and go to the Monolith
//     next(); 
// });
// 2. ALL USER TRAFFIC -> AUTH SERVICE (Port 4002)
app.use('/api/users', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    logger: console
}));


// 3C. Catalog Service Interception
app.use('/api/books', createProxyMiddleware({
    target: CATALOG_SERVICE_URL,
    changeOrigin: true,
    logger: console
}));

// 3D. Cart Service Interception
app.use('/api/cart', createProxyMiddleware({
    target: CART_SERVICE_URL,
    changeOrigin: true,
    logger: console
}));

// 3. CATCH-ALL (Monolith Fallback)
app.use('/', createProxyMiddleware({
    target: MONOLITH_URL,
    changeOrigin: true,
    logger: console
}));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`🧠 AI Traffic -> ${AI_SERVICE_URL}`);
    console.log(`🔐 Auth Traffic (Login/Register) -> ${AUTH_SERVICE_URL}`);
    console.log(`🛡️  Monolith Fallback -> ${MONOLITH_URL}`);
    console.log(`Catelog tapped ->${CATALOG_SERVICE_URL}`);
});