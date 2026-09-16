const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const otpStore = {};

exports.sendOtp = async (req, res) => {
  const { contact, type } = req.body;
  if (!contact) {
    return res.status(400).json({ success: false, message: 'Contact is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[contact] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  if (type === 'email' || contact.includes('@')) {
    const emailSent = await sendEmail(
      contact,
      'ChatMate - Your Verification OTP',
      `Your ChatMate OTP code is: ${otp}. Valid for 5 minutes.`
    );
    if (emailSent) {
      return res.status(200).json({ success: true, message: 'OTP sent to email successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }
  } else {
    console.log(`\n============================`);
    console.log(`[SMS OTP] Sent to ${contact}: ${otp}`);
    console.log(`============================\n`);
    return res.status(200).json({ success: true, message: 'OTP sent via SMS successfully', otp });
  }
};

exports.verifyOtp = async (req, res) => {
  const { contact, otp, name, phone, language } = req.body;
  if (!contact || !otp) {
    return res.status(400).json({ success: false, message: 'Contact and OTP are required' });
  }

  const record = otpStore[contact];
  if (!record) {
    return res.status(400).json({ success: false, message: 'No OTP requested for this contact' });
  }
  if (Date.now() > record.expiresAt) {
    delete otpStore[contact];
    return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });
  }
  if (record.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP code' });
  }

  delete otpStore[contact];

  const contactType = contact.includes('@') ? 'email' : 'phone';
  const languageCode = language || 'en';

  try {
    let user = await User.findOne({ contact });

    if (user) {
      const token = jwt.sign({ id: user._id, contact: user.contact, name: user.name }, process.env.JWT_SECRET, { expiresIn: '30d' });
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          contact: user.contact,
          phone: user.phone,
          language_code: user.language_code,
        },
      });
    }

    user = await User.create({
      name: name || 'User',
      contact,
      contact_type: contactType,
      phone: phone || null,
      language_code: languageCode,
    });

    const token = jwt.sign({ id: user._id, contact: user.contact, name: user.name }, process.env.JWT_SECRET, { expiresIn: '30d' });

    return res.status(200).json({
      success: true,
      message: 'Account created and verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        contact: user.contact,
        phone: user.phone,
        language_code: user.language_code,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating account', error: error.message });
  }
};