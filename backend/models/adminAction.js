const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { type: String, enum: ['delete','edit','create','other'], required: true },
  targetType: { type: String, enum: ['post','comment','user','subreddit','other'], required: true },
  targetId: { type: String },
  targetSummary: { type: String },
  details: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminAction', adminActionSchema);
