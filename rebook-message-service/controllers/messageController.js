// rebook-message-service/controllers/messageController.js
const Message = require('../models/Message');

const sendMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if(!name || !email || !message) {
        // 🚨 ADDED: Structured Warning Log
        req.log.warn({ email, name }, "Attempted to send message with missing fields");
        return res.status(400).json({ message: "Please fill all fields" });
    }

    // 🚨 ADDED: Structured Info Log
    req.log.info({ email, subject }, "Processing new incoming message");

    const newMessage = await Message.create({ name, email, subject, message });
    res.status(201).json(newMessage);
  } catch (error) {
    // 🚨 ADDED: Structured Error Log
    req.log.error({ err: error }, "Server Error while sending message");
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAllMessages = async (req, res) => {
  try {
    // 🚨 ADDED: Structured Info Log
    req.log.info("Fetching all messages from database");

    const messages = await Message.find({}).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    // 🚨 ADDED: Structured Error Log
    req.log.error({ err: error }, "Server Error while fetching messages");
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    // 🚨 ADDED: Structured Info Log
    req.log.info({ messageId: req.params.id }, "Attempting to delete message");

    const message = await Message.findById(req.params.id);
    if (message) {
      await message.deleteOne();
      
      // 🚨 ADDED: Structured Info Log
      req.log.info({ messageId: req.params.id }, "Message successfully removed");
      res.json({ message: 'Message removed' });
    } else {
      // 🚨 ADDED: Structured Warning Log
      req.log.warn({ messageId: req.params.id }, "Message deletion failed: Not found");
      res.status(404).json({ message: 'Message not found' });
    }
  } catch (error) {
    // 🚨 ADDED: Structured Error Log
    req.log.error({ err: error }, "Server Error while deleting message");
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { sendMessage, getAllMessages, deleteMessage };