const User = require('../models/User');
const Contact = require('../models/Contact');

// SEARCH USER BY CONTACT (email/phone)
exports.searchUser = async (req, res) => {
  const { contact } = req.query;
  if (!contact) {
    return res.status(400).json({ success: false, message: 'Contact is required' });
  }

  try {
    const user = await User.findOne({ contact }).select('_id name contact');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with this contact' });
    }
    res.status(200).json({ success: true, user: { id: user._id, name: user.name, contact: user.contact } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred', error: error.message });
  }
};

// ADD CONTACT
exports.addContact = async (req, res) => {
  const { user_id, contact_user_id } = req.body;

  if (!user_id || !contact_user_id) {
    return res.status(400).json({ success: false, message: 'user_id and contact_user_id are required' });
  }

  if (user_id === contact_user_id) {
    return res.status(400).json({ success: false, message: 'You cannot add yourself' });
  }

  try {
    const existing = await Contact.findOne({ user_id, contact_user_id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Contact already added' });
    }

    await Contact.create({ user_id, contact_user_id });
    res.status(201).json({ success: true, message: 'Contact added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred', error: error.message });
  }
};

// GET ALL CONTACTS FOR A USER
exports.getContacts = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id is required' });
  }

  try {
    const contacts = await Contact.find({ user_id }).populate('contact_user_id', 'name contact');

    const formatted = contacts.map((c) => ({
      id: c.contact_user_id._id,
      name: c.contact_user_id.name,
      contact: c.contact_user_id.contact,
    }));

    res.status(200).json({ success: true, contacts: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred', error: error.message });
  }
};

module.exports = exports;