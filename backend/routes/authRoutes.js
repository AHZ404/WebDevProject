const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/auth');

// When someone posts to '/', run the registerUser function
router.post('/signup', registerUser);

module.exports = router;