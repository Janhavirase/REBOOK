// /middleware/authMiddleware.js
const protect = (req, res, next) => {
    // 1. Read the custom headers sent by the API Gateway
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    // 2. If the header is missing, the Gateway didn't authenticate them
    if (!userId) {
        return res.status(401).json({ message: 'Not authorized, no user header found' });
    }

    // 3. Attach the minimal user info to the request object
    req.user = {
        _id: userId,
        isAdmin: userRole === 'admin' 
    };

    next();
};

module.exports = { protect };