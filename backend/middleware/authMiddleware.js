// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Get the token from the header (Remove "Bearer " string)
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token using your Secret Key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find the user in DB (excluding password) and attach to request
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Move to the next step (The Controller)
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
// --- ADD THIS NEW FUNCTION ---
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};
module.exports = { protect,admin };