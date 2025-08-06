const User = require('../models/User');
const Habit = require('../models/Habit');

/**
 * @desc    Get currently logged-in user's profile
 * @route   GET /api/profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Get a specific user's public profile by ID
 * @route   GET /api/profile/:userId
 * @access  Public
 */
exports.getUserProfile = async (req, res) => {
  try {
    // Select only public fields
    const user = await User.findById(req.params.userId).select('displayName bio avatarUrl createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch all public habits by that user
    const habits = await Habit.find({ user: req.params.userId });

    res.json({ user, habits });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Update display name or bio for logged-in user
 * @route   PUT /api/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  const { displayName, bio } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { displayName, bio },
      {
        new: true,         // Return updated doc
        runValidators: true // Apply schema validations
      }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Update user avatar (multipart/form-data, needs multer)
 * @route   PUT /api/profile/avatar
 * @access  Private
 */
exports.updateAvatar = async (req, res) => {
  try {
    // Ensure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl: req.file.path }, // `req.file.path` provided by multer
      { new: true }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
