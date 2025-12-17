// userRoutes.js (Complete and Verified)
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
console.log("--- userRoutes.js file loaded ---");
// CRITICAL: Ensure both functions are imported
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { getPostsByUser } = require('../controllers/postController'); 

// 1. GET /users/:username (Profile Data Fetch)
router.get('/:username', getUserProfile);

// 2. 🚨 CRITICAL FIX: PATCH /users/:username (Bio Update with file uploads)
router.patch('/:username', (req, res, next) => {
  console.log('PATCH /users/:username - Starting upload processing');
  upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }])(req, res, next);
}, updateUserProfile); 

// 3. GET /users/:username/posts (Profile Posts Fetch)
router.get('/:username/posts', getPostsByUser); 

module.exports = router;