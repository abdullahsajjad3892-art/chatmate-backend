const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message_text: { type: String, required: true },
  sender_language: { type: String, default: 'en' },
  is_read: { type: Boolean, default: false },
  sent_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);