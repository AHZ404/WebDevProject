const User = require('../models/user');
const Subreddit = require('../models/subreddit');
const Post = require('../models/post');
const Comment = require('../models/comment');
const bcrypt = require('bcryptjs');

// Create default admin if not exists
const setupAdmin = async (req, res) => {
  try {
    const existing = await User.findOne({ email: 'admin@reddit.com' });
    if (existing) return res.status(200).json({ message: 'Admin already exists', admin: { username: existing.username, email: existing.email } });

    const password = 'pass123';
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const admin = await User.create({ username: 'redditadmin', email: 'admin@reddit.com', password: hashed, role: 'admin', profile: { displayName: 'Reddit Admin' } });
    res.status(201).json({ message: 'Admin created', admin: { username: admin.username, email: admin.email } });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper to authenticate admin by username/password
const authAdmin = async (username, password) => {
  const admin = await User.findOne({ username });
  if (!admin || admin.role !== 'admin') return null;
  const match = await bcrypt.compare(password, admin.password);
  return match ? admin : null;
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername, adminPassword } = req.body || {};
    const admin = await authAdmin(adminUsername, adminPassword);
    if (!admin) return res.status(403).json({ message: 'Invalid admin credentials' });

    const userToDelete = await User.findById(id);
    if (!userToDelete) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndDelete(id);
    // Cascade delete posts/comments by that user
    await Post.deleteMany({ username: userToDelete.username });
    await Comment.deleteMany({ author: userToDelete._id });

    // record admin action
    try {
      const AdminAction = require('../models/adminAction');
      await AdminAction.create({
        admin: admin._id,
        actionType: 'delete',
        targetType: 'user',
        targetId: id,
        targetSummary: userToDelete.username,
        details: `Deleted user ${userToDelete.username}`
      });
    } catch (err) {
      console.error('Failed to record admin action (delete user):', err);
    }

    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSubredditAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername, adminPassword } = req.body || {};
    const admin = await authAdmin(adminUsername, adminPassword);
    if (!admin) return res.status(403).json({ message: 'Invalid admin credentials' });

    const subreddit = await Subreddit.findById(id);
    if (!subreddit) return res.status(404).json({ message: 'Subreddit not found' });

    await Subreddit.findByIdAndDelete(id);
    // Delete posts in that subreddit by matching the stored name
    await Post.deleteMany({ community: subreddit.name });

    // record admin action
    try {
      const AdminAction = require('../models/adminAction');
      await AdminAction.create({
        admin: admin._id,
        actionType: 'delete',
        targetType: 'subreddit',
        targetId: id,
        targetSummary: subreddit.name,
        details: `Deleted subreddit ${subreddit.name}`
      });
    } catch (err) { console.error('Failed to record admin action (delete subreddit):', err); }

    res.status(200).json({ message: 'Subreddit deleted' });
  } catch (error) {
    console.error('Error deleting subreddit:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deletePostAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername, adminPassword } = req.body || {};
    const admin = await authAdmin(adminUsername, adminPassword);
    if (!admin) return res.status(403).json({ message: 'Invalid admin credentials' });

    // get post details first
    const post = await Post.findById(id);
    await Post.findByIdAndDelete(id);
    await Comment.deleteMany({ post: id });

    // record admin action
    try {
      const AdminAction = require('../models/adminAction');
      await AdminAction.create({
        admin: admin._id,
        actionType: 'delete',
        targetType: 'post',
        targetId: id,
        targetSummary: post ? (post.title || post._id.toString()) : id,
        details: post ? `Deleted post by ${post.username}` : 'Deleted post'
      });
    } catch (err) { console.error('Failed to record admin action (delete post admin):', err); }

    res.status(200).json({ message: 'Post deleted by admin' });
  } catch (error) {
    console.error('Error deleting post (admin):', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCommentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername, adminPassword } = req.body || {};
    const admin = await authAdmin(adminUsername, adminPassword);
    if (!admin) return res.status(403).json({ message: 'Invalid admin credentials' });

    const comment = await Comment.findById(id);
    await Comment.findByIdAndDelete(id);

    // record admin action
    try {
      const AdminAction = require('../models/adminAction');
      await AdminAction.create({
        admin: admin._id,
        actionType: 'delete',
        targetType: 'comment',
        targetId: id,
        targetSummary: comment ? (comment.content ? comment.content.substring(0,120) : id) : id,
        details: comment ? `Deleted comment ${comment._id}` : 'Deleted comment'
      });
    } catch (err) {
      console.error('Failed to record admin action (delete comment admin):', err);
    }

    res.status(200).json({ message: 'Comment deleted by admin' });
  } catch (error) {
    console.error('Error deleting comment (admin):', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin action history (public)
const getAdminActions = async (req, res) => {
  try {
    const { username } = req.params;
    const adminUser = await User.findOne({ username });
    if (!adminUser || adminUser.role !== 'admin') return res.status(404).json({ message: 'Admin not found' });

    const AdminAction = require('../models/adminAction');
    const actions = await AdminAction.find({ admin: adminUser._id }).sort({ createdAt: -1 }).limit(500);
    res.status(200).json(actions);
  } catch (err) {
    console.error('Error fetching admin actions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { setupAdmin, deleteUser, deleteSubredditAdmin, deletePostAdmin, deleteCommentAdmin, getAdminActions };