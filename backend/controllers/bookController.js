const Book = require('../models/Book');
const cloudinary = require('../config/cloudinary'); 

// @desc    Get all books (Sorted by Distance if Location provided, else by Date)
// @route   GET /api/books?lat=12.34&lng=56.78
const getBooks = async (req, res) => {
  try {
    const { lat, lng } = req.query; // Get location from URL params

    // --- OPTION 1: LOCATION-BASED SORTING ---
    if (lat && lng) {
      console.log(`📍 Searching for books near: ${lat}, ${lng}`);

      const books = await Book.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: "distance", // This adds a 'distance' field (in meters) to the result
            maxDistance: 500000, // Search within 500km radius
            spherical: true
          }
        },
        {
            $lookup: {
                from: "users", 
                localField: "seller",
                foreignField: "_id",
                as: "seller"
            }
        },
        { $unwind: "$seller" } 
      ]);
      
      return res.json(books);
    }

    // --- OPTION 2: NORMAL FETCH (Recent First) ---
    const books = await Book.find().populate('seller', 'name email').sort({ createdAt: -1 });
    res.json(books);

  } catch (error) {
    console.error("Error in getBooks:", error);
    res.status(500).json({ message: 'Server Error fetching books' });
  }
};

// @desc    Get single book details
// @route   GET /api/books/:id
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('seller', 'name email phone');

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching book details' });
  }
};

// --- NEW FUNCTION: Get Similar Books ---
// @desc    Get similar books (Same category, excluding current)
// @route   GET /api/books/similar/:id/:category
const getSimilarBooks = async (req, res) => {
  try {
    const { id, category } = req.params;

    const books = await Book.find({
      category: category,      // 1. Match the category
      _id: { $ne: id }         // 2. Exclude the current book ($ne = Not Equal)
    }).limit(4);               // 3. Limit to 4 results

    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching similar books' });
  }
};

// @desc    Get logged-in user's books
// @route   GET /api/books/my-books
const getMyBooks = async (req, res) => {
  try {
    const books = await Book.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching my books' });
  }
};

// @desc    Create a book listing (Saves GPS Location)
// @route   POST /api/books/sell
const createBook = async (req, res) => {
  try {
    const { title, author, price, condition, description, category, city, latitude, longitude } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    // Prepare Location Object (GeoJSON)
    let locationData = {
        type: 'Point',
        coordinates: [0, 0] // Default
    };

    if (latitude && longitude) {
        locationData = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
    }

    const book = new Book({
      title,
      author,
      price,
      condition,
      description,
      category, 
      city: city ? city.toLowerCase() : 'unknown',
      location: locationData,
      seller: req.user._id, 
      image: {
        public_id: req.file.filename,
        url: req.file.path,
      },
    });

    const createdBook = await book.save();
    res.status(201).json(createdBook);

  } catch (error) {
    console.log("❌ ERROR IN CREATE BOOK:", error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Update a book listing
// @route   PUT /api/books/:id
const updateBook = async (req, res) => {
  try {
    const { title, author, price, condition, description, category, city } = req.body;
    
    const book = await Book.findById(req.params.id);

    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (book.seller.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    book.title = title || book.title;
    book.author = author || book.author;
    book.price = price || book.price;
    book.condition = condition || book.condition;
    book.description = description || book.description;
    book.category = category || book.category;
    book.city = city ? city.toLowerCase() : book.city;

    if (req.file) {
      book.image = { public_id: req.file.filename, url: req.file.path };
    }

    const updatedBook = await book.save();
    res.json(updatedBook);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating book' });
  }
};

// @desc    Delete a book (Seller OR Admin)
// @route   DELETE /api/books/:id
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // --- UPDATED SECURITY CHECK ---
    // Allow delete if: (User is the Seller) OR (User is an Admin)
    // We check: If user is NOT seller AND user is NOT admin, then deny access.
    if (book.seller.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(401).json({ message: 'Not authorized to delete this book' });
    }

    await book.deleteOne();
    res.json({ message: 'Book removed successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error deleting book' });
  }
};

// IMPORTANT: Export all functions
module.exports = { 
  getBooks, 
  getMyBooks, 
  createBook, 
  deleteBook, 
  updateBook, 
  getBookById,
  getSimilarBooks // <--- Added this to exports
};