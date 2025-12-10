const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary"); 

// Import Controller Functions 
const { 
    getBooks, 
    getMyBooks, 
    createBook, 
    deleteBook,
    updateBook,
    getBookById,
    getSimilarBooks // <--- 1. IMPORT THIS
} = require('../controllers/bookController');

// --- ROUTES ---

// 1. Get all books (Public - Home Page)
router.get('/', getBooks);

// 2. Get logged-in user's books (Private - My Listings)
router.get('/my-books', protect, getMyBooks);

// 3. Create a Listing (Private - Sell Page)
router.post('/sell', protect, upload.single('image'), createBook);

// 4. Get Similar Books (Public) <--- 2. ADD THIS ROUTE
// This fetches recommendations based on category
router.get('/similar/:id/:category', getSimilarBooks);

// 5. Get Single Book Details (Public)
router.get('/:id', getBookById);

// 6. Update a Listing (Private - Edit Page)
router.put('/:id', protect, upload.single('image'), updateBook);

// 7. Delete a Listing (Private)
router.delete('/:id', protect, deleteBook);

module.exports = router;