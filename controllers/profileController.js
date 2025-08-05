const User = require('../models/User');
const Habit = require('../models/Habit');

// @desc    Get logged-in user's profile
// @route   GET /api/profile
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

// @desc    Get a specific user's public profile by ID
// @route   GET /api/profile/:userId
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('displayName bio avatarUrl createdAt');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Also fetch their habits
        const habits = await Habit.find({ user: req.params.userId });
        res.json({ user, habits });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile (name, bio)
// @route   PUT /api/profile
exports.updateProfile = async (req, res) => {
    const { displayName, bio } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { displayName, bio },
            { new: true, runValidators: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user avatar
// @route   PUT /api/profile/avatar
exports.updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatarUrl: req.file.path },
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};