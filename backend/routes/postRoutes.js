const express = require('express');
const router = express.Router();

// Import ALL functions in ONE line (Do not duplicate this line!)
const { 
    getAllPosts, 
    createPost, 
    getPostsByUser, 
    votePost, 
    getPostById 
} = require('../controllers/postController'); 

router.get('/', getAllPosts);
router.post('/', createPost);
router.get('/user/:username', getPostsByUser); 
router.put('/:id/vote', votePost);
router.get('/:id', getPostById); // The new route

module.exports = router;