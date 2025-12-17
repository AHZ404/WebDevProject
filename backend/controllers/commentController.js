const Comment = require('../models/comment');
const Post = require('../models/post');
const User = require('../models/user'); 

// 1. CREATE COMMENT
const createComment = async (req, res) => {
  try {
    const { content, postId, parentId, username } = req.body;
    if (!content || !postId || !username) return res.status(400).json({ message: "Missing fields" });
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = await Comment.create({
      content, post: postId, parentComment: parentId || null, author: user._id,
      upvotedBy: [username], // Auto-upvote own comment
      downvotedBy: []
    });
    post.commentsCount += 1;
    await post.save();
    await newComment.populate('author', 'username');
    res.status(201).json(newComment);
  } catch (error) { res.status(500).json({ message: "Failed to create comment" }); }
};

// 2. GET POST COMMENTS
const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await Comment.find({ post: postId }).populate('author', 'username').sort({ createdAt: -1 });
        res.status(200).json(comments);
    } catch (error) { res.status(500).json({ message: "Failed to fetch comments" }); }
};

// 3. VOTE COMMENT
const voteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction, username } = req.body; 

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const alreadyUpvoted = comment.upvotedBy.includes(username);
    const alreadyDownvoted = comment.downvotedBy.includes(username);

    if (direction === 'up') {
        if (alreadyUpvoted) {
            comment.votes -= 1;
            comment.upvotedBy.pull(username);
        } else if (alreadyDownvoted) {
            comment.votes += 2;
            comment.downvotedBy.pull(username);
            comment.upvotedBy.push(username);
        } else {
            comment.votes += 1;
            comment.upvotedBy.push(username);
        }
    } else if (direction === 'down') {
        if (alreadyDownvoted) {
            comment.votes += 1;
            comment.downvotedBy.pull(username);
        } else if (alreadyUpvoted) {
            comment.votes -= 2;
            comment.upvotedBy.pull(username);
            comment.downvotedBy.push(username);
        } else {
            comment.votes -= 1;
            comment.downvotedBy.push(username);
        }
    }

    await comment.save();
    res.status(200).json(comment);
  } catch (error) { res.status(500).json({ message: "Error voting" }); }
};

// 4. GET COMMENTS BY USER (THIS WAS MISSING!)
const getCommentsByUser = async (req, res) => {
    try {
        const { username } = req.params;
        
        // 1. Find the User ID from the username string
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Find comments where 'author' matches that ID
        const comments = await Comment.find({ author: user._id })
            .sort({ createdAt: -1 })
            .populate('post', 'title community') // Get the post info
            .populate('author', 'username');     // Get the author info

        res.status(200).json(comments);
    } catch (error) {
        console.error("Error fetching user comments:", error);
        res.status(500).json({ message: "Failed to fetch user comments" });
    }
};

// Delete Comment (user or admin)
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, adminUsername, adminPassword } = req.body || {};

    console.log('DELETE /comments/:id called', { id, body: req.body });

    const comment = await Comment.findById(id).populate('author', 'username');
    if (!comment) {
      console.log('Comment not found:', id);
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Admin deletion
    if (adminUsername && adminPassword) {
      console.log('Admin credentials provided for comment deletion', adminUsername);
      const admin = await require('../models/user').findOne({ username: adminUsername });
      if (!admin || admin.role !== 'admin') {
        console.log('Admin not found or not admin role', adminUsername);
        return res.status(403).json({ message: 'Invalid admin credentials' });
      }
      const bcrypt = require('bcryptjs');
      const match = await bcrypt.compare(adminPassword, admin.password);
      if (!match) {
        console.log('Admin password mismatch for', adminUsername);
        return res.status(403).json({ message: 'Invalid admin credentials' });
      }

      // record admin action
      try {
        const AdminAction = require('../models/adminAction');
        await AdminAction.create({
          admin: admin._id,
          actionType: 'delete',
          targetType: 'comment',
          targetId: id,
          targetSummary: comment.content ? comment.content.substring(0,120) : id,
          details: `Deleted comment by ${comment.author?.username || 'unknown'}`
        });
      } catch (err) {
        console.error('Failed to record admin action (comment delete):', err);
      }

      await Comment.findByIdAndDelete(id);
      console.log('Comment deleted by admin', id);
      return res.status(200).json({ message: 'Comment deleted by admin' });
    }

    // User deletion
    if (!username) {
      console.log('No username provided for comment deletion');
      return res.status(400).json({ message: 'Username required to delete comment' });
    }

    if (!comment.author || !comment.author.username || comment.author.username.toLowerCase() !== username.toString().toLowerCase()) {
      console.log('Unauthorized comment delete attempt', { commentAuthor: comment.author?.username, attemptingUser: username });
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // record owner deletion
    try {
      const ownerUser = await User.findOne({ username });
      if (ownerUser) {
        const AdminAction = require('../models/adminAction');
        await AdminAction.create({
          admin: ownerUser._id,
          actionType: 'delete',
          targetType: 'comment',
          targetId: id,
          targetSummary: comment.content ? comment.content.substring(0,120) : id,
          details: `Owner deleted their comment`
        });
      }
    } catch (err) {
      console.error('Failed to record owner delete action (comment):', err);
    }

    await Comment.findByIdAndDelete(id);
    console.log('Comment deleted by owner', id);
    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { 
    createComment, 
    getPostComments, 
    voteComment,
    getCommentsByUser,
    deleteComment
};