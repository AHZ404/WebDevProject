const express = require('express');
const router = express.Router();
const { getSubreddits, createSubreddit } = require('../controllers/subredditController');

router.get('/', getSubreddits);
router.post('/', createSubreddit);

module.exports = router;