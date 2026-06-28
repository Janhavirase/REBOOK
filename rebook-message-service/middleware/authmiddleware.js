// rebook-message-service/middleware/authMiddleware.js

const protect = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const isAdmin = req.headers['x-user-is-admin'] === 'true';

    if (!userId) {
        return res.status(401).json({ message: 'Not authorized, no user header found' });
    }

    req.user = { _id: userId, isAdmin: isAdmin };
    next();
};

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };