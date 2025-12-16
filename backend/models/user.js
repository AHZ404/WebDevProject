const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    displayName: String,
    bio: String,
    avatar: String,
    banner: String,
    cakeDay: { 
      type: Date,
      default: Date.now
    }
  },
  karma: {
    postKarma: { type: Number, default: 0 },
    commentKarma: { type: Number, default: 0 }
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    nsfw: { type: Boolean, default: false },
    allowFollowers: { type: Boolean, default: true }
  },
  social: {
    followers: [{ type: ObjectId, ref: 'User' }],
    following: [{ type: ObjectId, ref: 'User' }],
    blockedUsers: [{ type: ObjectId, ref: 'User' }]
  },
  moderating: [{ type: ObjectId, ref: 'Subreddit' }], 
  joinedSubreddits: [{ type: ObjectId, ref: 'Subreddit' }],
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.plugin(AutoIncrement, { inc_field: 'id' });

const User = mongoose.model('User', userSchema);
module.exports = User;