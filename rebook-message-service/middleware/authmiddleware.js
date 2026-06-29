const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    
    // 1. Look for the standard Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // 2. Decode the VIP pass using your shared secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 3. Attach the user data
            req.user = { 
                _id: decoded.id,
                // See Architecture Note below regarding isAdmin
                isAdmin: decoded.isAdmin !== undefined ? decoded.isAdmin : true 
            };
            
            return next();
        } catch (error) {
            console.error("Token verification failed in Message Service:", error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };