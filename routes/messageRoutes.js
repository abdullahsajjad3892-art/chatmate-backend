const express = require('express');
const router = express.Router();
const { getMessages, getChatsList } = require('../controllers/messageController');

router.get('/history', getMessages);
router.get('/chats', getChatsList);

module.exports = router;