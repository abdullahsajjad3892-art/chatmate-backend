const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content_text: { type: String, required: true },
  background_color: { type: String, default: '#128C7E' },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true },
  likes: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reacted_at: { type: Date, default: Date.now },
    },
  ],
  dislikes: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reacted_at: { type: Date, default: Date.now },
    },
  ],
});

// MongoDB khud story ko expire hone ke baad delete kar dega
storySchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);