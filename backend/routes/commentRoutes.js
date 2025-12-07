const express = require('express');
const router = express.Router();

// <--- FIX: Added 'voteComment' to the import list
const { createComment, getPostComments, voteComment } = require('../controllers/commentController');

router.post('/', createComment);
router.get('/post/:postId', getPostComments);
router.put('/:id/vote', voteComment); 

module.exports = router;