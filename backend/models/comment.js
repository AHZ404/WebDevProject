const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true, trim: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  votes: { type: Number, default: 1 },
  isDeleted: { type: Boolean, default: false },

  // <--- CHANGED: Store Usernames (Strings)
  upvotedBy: [{ type: String }],
  downvotedBy: [{ type: String }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);