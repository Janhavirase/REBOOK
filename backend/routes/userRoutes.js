const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware'); // <--- FIX: Import 'admin' here!

const { 
    registerUser, 
    loginUser, 
    addToCart,      
    getCart, 
    removeFromCart,
    getUserProfile, 
    addReview, 
    getUsers,       // <--- Ensure these are imported
    deleteUser      // <--- Ensure these are imported
} = require('../controllers/userController');

// --- AUTH ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- CART (Protected) ---
router.get('/cart', protect, getCart);
router.post('/cart/:id', protect, addToCart);
router.delete('/cart/:id', protect, removeFromCart);

// --- PROFILE & REVIEWS ---
router.get('/profile/:id', getUserProfile);      
router.post('/:id/reviews', protect, addReview); 

// --- ADMIN USER MANAGEMENT ---
// Now 'admin' is defined and this will work
router.get('/', protect, admin, getUsers);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;