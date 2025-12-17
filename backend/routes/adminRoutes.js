const express = require('express');
const router = express.Router();
const { setupAdmin, deleteUser, deleteSubredditAdmin, deletePostAdmin, deleteCommentAdmin, getAdminActions } = require('../controllers/adminController');

router.post('/setup', setupAdmin);
router.delete('/users/:id', deleteUser);
router.delete('/subreddits/:id', deleteSubredditAdmin);
router.delete('/posts/:id', deletePostAdmin);
router.delete('/comments/:id', deleteCommentAdmin);
router.get('/actions/:username', getAdminActions);

module.exports = router;