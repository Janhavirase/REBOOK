const mongoose = require('mongoose');

const outboxSchema = new mongoose.Schema({
    eventType: { type: String, required: true },
    payload: { type: Object, required: true },
    status: { type: String, enum: ['PENDING', 'PROCESSED', 'FAILED'], default: 'PENDING' },
    retries: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Outbox', outboxSchema);