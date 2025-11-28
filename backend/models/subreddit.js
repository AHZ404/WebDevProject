/*const subredditSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 21,
    match: /^[a-zA-Z0-9_]+$/  // Only letters, numbers, underscores
  },
  displayName: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  rules: [{
    title: String,
    description: String,
    order: Number
  }],
  moderators: [{
    user: { type: ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'moderator', 'helper'], default: 'moderator' },
    addedAt: { type: Date, default: Date.now }
  }],
  members: [{ type: ObjectId, ref: 'User' }], // Users who joined this community
  memberCount: { type: Number, default: 0 },
  icon: String,
  banner: String,
  primaryColor: String,
  secondaryColor: String,
  nsfw: { type: Boolean, default: false },
  type: {
    type: String,
    enum: ['public', 'restricted', 'private'],
    default: 'public'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: { type: ObjectId, ref: 'User' }
});

const Subreddit = mongoose.model('Subreddit', SubredditSchema);
module.exports = Subreddit;
*/