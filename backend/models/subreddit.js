const mongoose = require('mongoose');

const subredditSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  // <--- UPDATED: Only 'public' and 'restricted' allowed
  privacyMode: {
    type: String,
    enum: ['public', 'restricted'], 
    default: 'public'
  },
  isOver18: {
    type: Boolean,
    default: false
  },
  logo: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  members: {
    type: Number,
    default: 1
  },
  // NEW: Track specific users to prevent duplicate joins
  membersList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subreddit', subredditSchema);