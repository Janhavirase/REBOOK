require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit'); // 🚨 NEW: Import the limiter
const { requestLogger } = require('./config/logger'); // 🚨 Import Logger
const client = require('prom-client'); // 🚨 NEW: Import Prometheus Client
const app = express();

app.use(requestLogger);
app.set('trust proxy', 1);



app.use(cors({
    origin: [
        "http://localhost:5173",
"https://rebook-gamma.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// 2. Create a custom metric: HTTP Request Duration (Latency)
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10] // Measurement buckets
});

// 3. Create a custom metric: Total HTTP Requests (Throughput)
const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// 4. Middleware to intercept and measure every request
app.use((req, res, next) => {
    // Start the timer
    const end = httpRequestDurationMicroseconds.startTimer();
    
    // When the request finishes, record the stats
    res.on('finish', () => {
        const labels = { route: req.path, status_code: res.statusCode, method: req.method };
        httpRequestsTotal.inc(labels); // Increment total request counter
        end(labels);                   // Record the time it took
    });
    next();
});


app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        service: 'ReBook API Gateway',
        timestamp: new Date().toISOString()
    });
});
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
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
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4003';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:4004';
const MESSAGE_SERVICE_URL = process.env.MESSAGE_SERVICE_URL || 'http://localhost:4005';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4006';

// 1. AI SERVICE ROUTE
app.use('/api/ai', createProxyMiddleware({
    target: AI_SERVICE_URL,
    changeOrigin: true,
    logger: console,
    // 🚨 SENIOR MOVE: Inject the correlation ID into the outgoing headers for Distributed Tracing
    onProxyReq: (proxyReq, req, res) => {
        if (req.id) {
            proxyReq.setHeader('x-correlation-id', req.id);
        }
    }
}));


app.use('/api/payment', createProxyMiddleware({
    target: PAYMENT_SERVICE_URL,
    changeOrigin: true,
    logger: console,
    // 🚨 SENIOR MOVE: Inject the correlation ID
    onProxyReq: (proxyReq, req, res) => {
        if (req.id) {
            proxyReq.setHeader('x-correlation-id', req.id);
        }
    }
}));

// 3E. Message Service Interception
app.use('/api/messages', createProxyMiddleware({
    target: MESSAGE_SERVICE_URL,
    changeOrigin: true,
    logger: console,
    // 🚨 SENIOR MOVE: Inject the correlation ID
    onProxyReq: (proxyReq, req, res) => {
        if (req.id) {
            proxyReq.setHeader('x-correlation-id', req.id);
        }
    }
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
    logger: console,
    // 🚨 SENIOR MOVE: Inject the correlation ID
    onProxyReq: (proxyReq, req, res) => {
        if (req.id) {
            proxyReq.setHeader('x-correlation-id', req.id);
        }
    }
}));


// 3C. Catalog Service Interception
// 3C. Catalog Service Interception
app.use('/api/books', createProxyMiddleware({
    target: CATALOG_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/books': '', // This removes '/api/books' so the Catalog service receives '/'
    },
    logger: console,
    // 🚨 SENIOR MOVE: Inject the correlation ID
    onProxyReq: (proxyReq, req, res) => {
        if (req.id) {
            proxyReq.setHeader('x-correlation-id', req.id);
        }
    }
}));
// 3D. Cart Service Interception
app.use('/api/cart', createProxyMiddleware({
    target: CART_SERVICE_URL,
    changeOrigin: true,
    logger: console,
    // 🚨 SENIOR MOVE: Inject the correlation ID
    onProxyReq: (proxyReq, req, res) => {
        if (req.id) {
            proxyReq.setHeader('x-correlation-id', req.id);
        }
    }
}));

// 3. CATCH-ALL (Monolith Fallback)


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`🧠 AI Traffic -> ${AI_SERVICE_URL}`);
    console.log(`🔐 Auth Traffic (Login/Register) -> ${AUTH_SERVICE_URL}`);
    console.log(`Catelog tapped ->${CATALOG_SERVICE_URL}`);
    console.log(`📨 Message Traffic -> ${MESSAGE_SERVICE_URL}`); // 👇 ADD THIS
});