const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true, unique: true },
  contact_type: { type: String, required: true },
  phone: { type: String, default: null },
  language_code: { type: String, default: 'en' },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);