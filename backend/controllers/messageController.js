const Message = require('../models/Message');

// @desc    Submit a new message (Public)
// @route   POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if(!name || !email || !message) {
        return res.status(400).json({ message: "Please fill all fields" });
    }

    const newMessage = await Message.create({ name, email, subject, message });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all messages (Admin Only)
// @route   GET /api/messages
const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete message (Admin Only)
// @route   DELETE /api/messages/:id
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (message) {
      await message.deleteOne();
      res.json({ message: 'Message removed' });
    } else {
      res.status(404).json({ message: 'Message not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { sendMessage, getAllMessages, deleteMessage };