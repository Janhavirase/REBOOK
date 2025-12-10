const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUser: { // The Seller being rated
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews (One user can review a seller only once)
reviewSchema.index({ reviewer: 1, targetUser: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);