const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Review = require('../models/Review'); // <--- Import Review
const Book = require('../models/Book');     // <--- Import Book (to show seller's books)
// Helper function to generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/users/register
const registerUser = async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
        return res.status(400).json({ message: 'Please add all fields including Phone Number' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin, // <--- ADD THIS LINE
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// --- NEW CART FUNCTIONS (ADD THESE) ---

// @desc    Add book to User's Cart
// @route   POST /api/users/cart/:id
const addToCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const bookId = req.params.id;

    // Check if book is already in cart to avoid duplicates
    if (user.cart.includes(bookId)) {
      return res.status(400).json({ message: 'Book already in cart' });
    }

    user.cart.push(bookId);
    await user.save();
    
    res.json(user.cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error adding to cart' });
  }
};

// @desc    Get User's Cart
// @route   GET /api/users/cart
const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
        path: 'cart',
        populate: { path: 'seller', select: 'name email phone' }
    });
    res.json(user.cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching cart' });
  }
};

// @desc    Remove book from Cart
// @route   DELETE /api/users/cart/:id
const removeFromCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.cart = user.cart.filter(bookId => bookId.toString() !== req.params.id);
    
    await user.save();
    res.json(user.cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error removing from cart' });
  }
};
// --- PROFILE & REVIEWS (NEW) ---

// @desc    Get Public User Profile
// @route   GET /api/users/profile/:id
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -cart');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const books = await Book.find({ seller: req.params.id });
    const reviews = await Review.find({ targetUser: req.params.id }).populate('reviewer', 'name');

    res.json({ user, books, reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add Review
// @route   POST /api/users/:id/reviews
const addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const sellerId = req.params.id;

  try {
    if (req.user._id.toString() === sellerId) return res.status(400).json({ message: 'You cannot review yourself' });

    const alreadyReviewed = await Review.findOne({ reviewer: req.user._id, targetUser: sellerId });
    if (alreadyReviewed) return res.status(400).json({ message: 'You already reviewed this seller' });

    await Review.create({
        reviewer: req.user._id,
        targetUser: sellerId,
        rating,
        comment
    });

    res.status(201).json({ message: 'Review Added' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Get all users (Admin only)
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.isAdmin) {
        return res.status(400).json({ message: 'Cannot delete Admin account' });
      }
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// IMPORTANT: Export ALL functions
module.exports = { 
    registerUser, 
    loginUser, 
    addToCart,      // <--- Added
    getCart,        // <--- Added
    removeFromCart,
    getUserProfile,
    addReview, // <--- New Exports  // <--- Added
    getUsers, 
    deleteUser
};