const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { 
    getSubreddits, 
    createSubreddit, 
    getSubredditByName, 
    updateSubreddit,
    joinSubreddit,
    leaveSubreddit,
    searchSubreddits
} = require('../controllers/subredditController');

console.log('Subreddit routes loaded');

router.get('/', getSubreddits);
router.get('/search', searchSubreddits);
router.get('/:name', getSubredditByName);

// POST route with multer middleware for file uploads
router.post('/', (req, res, next) => {
  console.log('POST /subreddits - Starting upload processing');
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }])(req, res, next);
}, createSubreddit);

// PUT route for updating subreddit (with multer middleware for file uploads)
router.put('/:name', (req, res, next) => {
  console.log('PUT /subreddits/:name - Starting upload processing');
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }])(req, res, next);
}, updateSubreddit);

// NEW: Join/Leave Routes
router.put('/:name/join', joinSubreddit);
router.put('/:name/leave', leaveSubreddit);

module.exports = router;