const mongoose = require("mongoose");

const bookSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    
    condition: { 
        type: String, 
        required: true, 
        enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'] 
    },

    description: { type: String, required: true },
    
    // --- UPDATED CATEGORIES ---
    category: { 
        type: String, 
        required: true,
        // Expanded list to match your Frontend
        enum: [
          'Education', 
          'Fiction', 
          'Non-Fiction', 
          'Comics', 
          'Mystery', 
          'History', 
          'Technology', 
          'Health'
        ] 
    },
    
    // 1. City (Display Name)
    city: { 
      type: String, 
      required: true, 
      trim: true,
      lowercase: true 
    }, 

    // 2. Geospatial Location (Coordinates)
    location: {
      type: {
        type: String, 
        enum: ['Point'], 
        default: 'Point'
      },
      coordinates: {
        type: [Number], // Format: [Longitude, Latitude]
        required: true
      }
    },

    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    image: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Create index for GPS sorting
bookSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Book", bookSchema);