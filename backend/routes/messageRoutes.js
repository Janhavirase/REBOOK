const express = require('express');
const router = express.Router();
const { sendMessage, getAllMessages, deleteMessage } = require('../controllers/messageController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public Route (Anyone can contact support)
router.post('/', sendMessage);

// Admin Routes (Protected + Admin Check)
router.get('/', protect, admin, getAllMessages);
router.delete('/:id', protect, admin, deleteMessage);

module.exports = router;