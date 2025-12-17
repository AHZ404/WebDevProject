const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

const { 
    getAllPosts, 
    createPost, 
    getPostsByUser, 
    votePost, 
    getPostById,
    searchPosts,
    summarizePost
} = require('../controllers/postController'); 

router.get('/', getAllPosts);
router.get('/search', searchPosts);
router.post("/create", upload.single("media"), createPost);
router.get('/user/:username', getPostsByUser); 
router.put('/:id/vote', votePost);
router.get('/:id', getPostById); 
router.post('/summarize', summarizePost);


module.exports = router;