const express = require('express');
const router = express.Router();

// <--- FIX: Added 'voteComment' to the import list
const { createComment, getPostComments, voteComment, getCommentsByUser } = require('../controllers/commentController');

router.post('/', createComment);
router.get('/post/:postId', getPostComments);
router.put('/:id/vote', voteComment); 
router.get('/user/:username', getCommentsByUser);

module.exports = router;