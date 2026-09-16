const User = require('../models/User');
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const { translateText } = require('../utils/translate');

// GET CHAT HISTORY between two users (translated into viewer's language)
exports.getMessages = async (req, res) => {
  const { user_id, contact_id } = req.query;

  if (!user_id || !contact_id) {
    return res.status(400).json({ success: false, message: 'user_id and contact_id are required' });
  }

  try {
    const viewer = await User.findById(user_id);
    const viewerLanguage = viewer?.language_code || 'en';

    const messages = await Message.find({
      $or: [
        { sender_id: user_id, receiver_id: contact_id },
        { sender_id: contact_id, receiver_id: user_id },
      ],
    }).sort({ sent_at: 1 });

    const translatedMessages = await Promise.all(
      messages.map(async (msg) => {
        const originalLang = msg.sender_language || 'en';
        const displayText = await translateText(msg.message_text, originalLang, viewerLanguage);
        return {
          id: msg._id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          message_text: displayText,
          sent_at: msg.sent_at,
        };
      })
    );

    res.status(200).json({ success: true, messages: translatedMessages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred', error: error.message });
  }
};

// GET ALL CHATS LIST (last message with each contact, translated for viewer)
exports.getChatsList = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id is required' });
  }

  try {
    const viewer = await User.findById(user_id);
    const viewerLanguage = viewer?.language_code || 'en';

    const contacts = await Contact.find({ user_id }).populate('contact_user_id', 'name contact');

    const chats = await Promise.all(
      contacts.map(async (c) => {
        const contactUser = c.contact_user_id;

        const lastMessage = await Message.findOne({
          $or: [
            { sender_id: user_id, receiver_id: contactUser._id },
            { sender_id: contactUser._id, receiver_id: user_id },
          ],
        }).sort({ sent_at: -1 });

        let displayText = 'Say hello!';
        let lastMessageTime = null;

        if (lastMessage) {
          const originalLang = lastMessage.sender_language || 'en';
          displayText = await translateText(lastMessage.message_text, originalLang, viewerLanguage);
          lastMessageTime = lastMessage.sent_at;
        }

        return {
          contact_id: contactUser._id,
          contact_name: contactUser.name,
          contact_info: contactUser.contact,
          last_message: displayText,
          last_message_time: lastMessageTime,
        };
      })
    );

    // Sabse naye message wali chat upar dikhayein
    chats.sort((a, b) => {
      if (!a.last_message_time) return 1;
      if (!b.last_message_time) return -1;
      return new Date(b.last_message_time) - new Date(a.last_message_time);
    });

    res.status(200).json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred', error: error.message });
  }
};

module.exports = exports;