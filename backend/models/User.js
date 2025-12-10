const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { 
        type: String, 
        required: true 
    },
    isAdmin: { type: Boolean, default: false }, 

    // --- NEW: SHOPPING CART ---
    // Stores a list of Book IDs that the user is interested in
    cart: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book'
        }
    ]
    // --------------------------

}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);