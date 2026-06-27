// rebook-catalog-service/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Decode the token using the shared secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 🚨 THE MICROSERVICE MAGIC 🚨
            // We DO NOT query the database. We just attach the raw ID from the token!
            // (Note: use decoded.id or decoded.userId based on how your Auth service creates it)
            req.user = { _id: decoded.id || decoded.userId }; 

            next();
        } catch (error) {
            console.error('JWT Verification Failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };