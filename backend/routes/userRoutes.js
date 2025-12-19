// userRoutes.js (Complete and Verified + Follow/Unfollow Routes Added)
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
console.log("--- userRoutes.js file loaded ---");

// Import controllers
const {
  getUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  searchUsers
} = require('../controllers/userController');

const { getPostsByUser } = require('../controllers/postController');

router.get('/search', searchUsers);

// ✅ Follow/Unfollow routes (added, does not affect existing routes)
// POST /users/:username/follow
router.post('/:username/follow', followUser);

// POST /users/:username/unfollow
router.post('/:username/unfollow', unfollowUser);

// 1. GET /users/:username (Profile Data Fetch)
router.get('/:username', getUserProfile);

// 2. PATCH /users/:username (Bio Update with file uploads)
router.patch('/:username', (req, res, next) => {
  console.log('PATCH /users/:username - Starting upload processing');
  upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }])(req, res, next);
}, updateUserProfile);

// 3. GET /users/:username/posts (Profile Posts Fetch)
router.get('/:username/posts', getPostsByUser);

module.exports = router;
