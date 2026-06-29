// rebook-catalog-service/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    
    // 1. Look for the Bearer token passed through the API Gateway
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Extract the token
            token = req.headers.authorization.split(' ')[1];
            
            // 3. Verify the token using your shared secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 4. Attach the ID to the request so the controller knows who is selling the book
            req.user = {
                _id: decoded.id
            };
            
            return next();
        } catch (error) {
            console.error("Token verification failed in Catalog Service:", error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };