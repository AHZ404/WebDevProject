// userController.js (Complete and Verified + Follow/Unfollow Added)
const User = require('../models/user');

/**
 * @desc Get user profile data by username
 * @route GET /users/:username
 * Optional query: ?viewer=<viewerUsername>  (to include isFollowedByViewer)
 */
const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const viewerUsername = req.query.viewer;

    // Include social followers for followerCount + follow status
    const user = await User.findOne({ username }).select(
      'username profile karma preferences.allowFollowers role social.followers'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followerCount = Array.isArray(user.social?.followers) ? user.social.followers.length : 0;

    // By default, don’t assume follow state unless viewer is provided
    let isFollowedByViewer = false;

    if (viewerUsername) {
      const viewer = await User.findOne({ username: viewerUsername }).select('_id');
      if (viewer && Array.isArray(user.social?.followers)) {
        isFollowedByViewer = user.social.followers.some(
          (id) => id && id.toString() === viewer._id.toString()
        );
      }
    }

    // Return original fields + added follow info (non-breaking additions)
    res.status(200).json({
      ...user.toObject(),
      followerCount,
      isFollowedByViewer
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

/**
 * @desc Update user profile data (e.g., bio, avatar, banner)
 * @route PATCH /users/:username
 */
const updateUserProfile = async (req, res) => {
  try {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📝 PROFILE UPDATE REQUEST for: ${req.params.username}`);
    console.log(`${'='.repeat(50)}`);
    console.log('📦 Body:', req.body);
    console.log('📁 Files:', req.files ? Object.keys(req.files) : 'none');

    const { username } = req.params;
    const { bio } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ message: 'User not found for update.' });
    }

    if (!user.profile) {
      user.profile = {};
    }

    // Update the bio field
    if (bio !== undefined && bio !== null) {
      console.log('📝 Updating bio');
      user.profile.bio = bio;
    }

    // Update avatar if uploaded
    if (req.files && req.files.avatar && req.files.avatar.length > 0) {
      const avatarPath = req.files.avatar[0].path;
      console.log('🖼️ Updating avatar to:', avatarPath);
      user.profile.avatar = avatarPath;
    }

    // Update banner if uploaded
    if (req.files && req.files.banner && req.files.banner.length > 0) {
      const bannerPath = req.files.banner[0].path;
      console.log('🎨 Updating banner to:', bannerPath);
      user.profile.banner = bannerPath;
    }

    await user.save();

    console.log('✅ User profile saved successfully');
    console.log('Final avatar:', user.profile.avatar);
    console.log('Final banner:', user.profile.banner);

    res.status(200).json({
      message: 'Profile updated successfully',
      newBio: user.profile.bio,
      avatar: user.profile.avatar,
      banner: user.profile.banner
    });
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    res.status(500).json({ message: 'Server error while updating profile', error: error.message });
  }
};

/**
 * Helper: resolve current user (follower) username
 * We support BOTH:
 *  - req.user.username (if your project uses auth middleware)
 *  - req.body.currentUsername (if you pass it from frontend)
 */
const getActingUsername = (req) => {
  if (req.user && req.user.username) return req.user.username;
  if (req.body && req.body.currentUsername) return req.body.currentUsername;
  return null;
};

/**
 * @desc Follow a user
 * @route POST /users/:username/follow
 * Body: { currentUsername: "viewerName" }  (if no auth middleware)
 */
const followUser = async (req, res) => {
  try {
    const targetUsername = req.params.username;
    const actingUsername = getActingUsername(req);

    if (!actingUsername) {
      return res.status(400).json({ message: 'currentUsername is required' });
    }

    if (actingUsername.toLowerCase() === targetUsername.toLowerCase()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const [actingUser, targetUser] = await Promise.all([
      User.findOne({ username: actingUsername }).select('_id social.following'),
      User.findOne({ username: targetUsername }).select('_id social.followers preferences.allowFollowers')
    ]);

    if (!actingUser) return res.status(404).json({ message: 'Acting user not found' });
    if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

    // Optional rule: if profile disallows followers
    if (targetUser.preferences && targetUser.preferences.allowFollowers === false) {
      return res.status(403).json({ message: 'This user does not allow followers' });
    }

    const followerId = actingUser._id;
    const targetId = targetUser._id;

    // 1) Add follower to target ONLY if not already present
    const addFollowerResult = await User.updateOne(
      { _id: targetId, 'social.followers': { $ne: followerId } },
      { $addToSet: { 'social.followers': followerId } }
    );

    // 2) Add target to acting user's following ONLY if not already present
    // (run regardless; $addToSet keeps it safe)
    await User.updateOne(
      { _id: followerId },
      { $addToSet: { 'social.following': targetId } }
    );

    // Fresh followerCount
    const updatedTarget = await User.findById(targetId).select('social.followers');
    const followerCount = Array.isArray(updatedTarget.social?.followers) ? updatedTarget.social.followers.length : 0;

    return res.status(200).json({
      message: addFollowerResult.modifiedCount === 1 ? 'Followed successfully' : 'Already following',
      following: true,
      followerCount
    });
  } catch (error) {
    console.error('❌ Error following user:', error);
    res.status(500).json({ message: 'Server error while following user', error: error.message });
  }
};

/**
 * @desc Unfollow a user
 * @route POST /users/:username/unfollow
 * Body: { currentUsername: "viewerName" }  (if no auth middleware)
 */
const unfollowUser = async (req, res) => {
  try {
    const targetUsername = req.params.username;
    const actingUsername = getActingUsername(req);

    if (!actingUsername) {
      return res.status(400).json({ message: 'currentUsername is required' });
    }

    if (actingUsername.toLowerCase() === targetUsername.toLowerCase()) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }

    const [actingUser, targetUser] = await Promise.all([
      User.findOne({ username: actingUsername }).select('_id'),
      User.findOne({ username: targetUsername }).select('_id social.followers')
    ]);

    if (!actingUser) return res.status(404).json({ message: 'Acting user not found' });
    if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

    const followerId = actingUser._id;
    const targetId = targetUser._id;

    // 1) Remove follower from target ONLY if it exists
    const pullFollowerResult = await User.updateOne(
      { _id: targetId, 'social.followers': followerId },
      { $pull: { 'social.followers': followerId } }
    );

    // 2) Remove target from acting user's following
    await User.updateOne(
      { _id: followerId },
      { $pull: { 'social.following': targetId } }
    );

    // Fresh followerCount
    const updatedTarget = await User.findById(targetId).select('social.followers');
    const followerCount = Array.isArray(updatedTarget.social?.followers) ? updatedTarget.social.followers.length : 0;

    return res.status(200).json({
      message: pullFollowerResult.modifiedCount === 1 ? 'Unfollowed successfully' : 'You were not following this user',
      following: false,
      followerCount
    });
  } catch (error) {
    console.error('❌ Error unfollowing user:', error);
    res.status(500).json({ message: 'Server error while unfollowing user', error: error.message });
  }
};


const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query required" });

    const users = await User.find({ 
      username: { $regex: q, $options: 'i' } 
    })
    .select('username profile.avatar profile.bio') 
    .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  getUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  searchUsers
};
