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
      'username profile karma preferences.allowFollowers'
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
 * @desc Update user profile data (e.g., bio)
 * @route PATCH /users/:username
 */
const updateUserProfile = async (req, res) => {
    try {
        console.log(`--- ATTEMPTING BIO UPDATE for user: ${req.params.username} ---`);
        const { username } = req.params;
        const { bio } = req.body; 

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found for update.' });
        }

        if (!user.profile) {
            user.profile = {};
        }
        
        // Update the bio field
        user.profile.bio = bio; 

        await user.save();

        res.status(200).json({ 
            message: 'Profile bio updated successfully',
            newBio: user.profile.bio 
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error while updating profile' });
    }
};


module.exports = {
  getUserProfile,
  // 🚨 CRITICAL FIX: Exporting the update function
  updateUserProfile, 
};