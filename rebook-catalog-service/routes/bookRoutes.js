// rebook-catalog-service/routes/bookRoutes.js
const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary"); 
const cacheBooks = require('../middleware/cacheMiddleware');
const { protect } = require('../middleware/authMiddleware'); // <--- 1. IMPORT THIS

const { 
    getBooks, 
    getMyBooks, 
    createBook, 
    deleteBook,
    updateBook,
    getBookById,
    getSimilarBooks,
     getBooksBySeller
} = require('../controllers/bookController');

// --- ROUTES ---

// 1. Get all books (Public)
router.route('/')
    .get(cacheBooks, getBooks);

// 2. Create Listing (Private - Needs protect)
router.post('/sell', protect, upload.single('image'), createBook); // <--- 2. ADD PROTECT

// 3. Get logged-in user's books (Private - Needs protect)
router.get('/my-books', protect, getMyBooks); // <--- 3. ADD PROTECT

// 4. Get Similar Books (Public)
router.get('/similar/:id/:category', getSimilarBooks);
// Get books for a specific seller's profile
router.get('/seller/:id', getBooksBySeller);
// 5. Single Book Operations
router.route('/:id')
    .get(getBookById) // Public
    .put(protect, upload.single('image'), updateBook) // Private
    .delete(protect, deleteBook); // Private

module.exports = router;