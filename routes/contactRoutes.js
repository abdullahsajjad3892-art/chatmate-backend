const express = require('express');
const router = express.Router();
const { searchUser, addContact, getContacts } = require('../controllers/contactController');

router.get('/search', searchUser);
router.post('/add', addContact);
router.get('/all', getContacts);

module.exports = router;