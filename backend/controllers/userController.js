// userController.js (Complete and Verified)
const User = require('../models/user'); 

/**
 * @desc Get user profile data by username
 * @route GET /users/:username
 */
const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select(
      'username profile karma preferences.allowFollowers role'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
    
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


module.exports = {
  getUserProfile,
  // 🚨 CRITICAL FIX: Exporting the update function
  updateUserProfile, 
};