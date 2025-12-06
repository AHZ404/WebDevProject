const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const postSchema = mongoose.Schema({
  // Link the post to the user who created it
  user: {
    type: ObjectId,
    ref: 'User', 
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: [true, 'A post must have a title'],
    trim: true,
    maxlength: 300,
  },
  content: {
    type: String,
    maxlength: 4000,
  },
  community: {
    type: String,
    default: 'r/javascript' // Default community for now
  },
  votes: {
    type: Number,
    default: 1,
  },
  commentsCount: {
    type: Number,
    default: 0,
  },
  image: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;