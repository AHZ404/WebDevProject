const express = require('express');
const router = express.Router();
const { getAllPosts, createPost, getPostsByUser, votePost } = require('../controllers/postController'); // <--- Import votePost

router.get('/', getAllPosts);
router.post('/', createPost);
router.get('/user/:username', getPostsByUser); 

// <--- NEW ROUTE: PUT /posts/:id/vote
router.put('/:id/vote', votePost); 

module.exports = router;