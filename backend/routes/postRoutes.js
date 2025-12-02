// postRoutes.js 
const express = require('express');
const router = express.Router();
const { getAllPosts, createPost } = require('../controllers/postController'); 
router.get('/', getAllPosts); 
router.post('/', createPost); 
module.exports = router;