const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  community: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, trim: true },
  media: { type: String ,required: false},
  mediaUrl: { type: String, required: false}, 
  votes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  
  // <--- CHANGED: Store Usernames (Strings) instead of IDs
  upvotedBy: [{ type: String }],
  downvotedBy: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);