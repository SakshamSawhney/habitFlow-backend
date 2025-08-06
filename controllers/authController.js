const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Add a check to ensure the JWT_SECRET is present on server start
if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in your .env file.");
    process.exit(1);
}

// Function which help to generate a JSON WEB TOKEN
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  const { email, password, displayName } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      email,
      password,
      displayName: displayName || email.split('@')[0],
    });

    if (user) {
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        ...userResponse,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error("Register Error:", error); // Added detailed logging
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      const userResponse = user.toObject();
      delete userResponse.password;
      
      res.json({
        ...userResponse,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("Login Error:", error); // Added detailed logging
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        // req.user is attached from the 'protect' middleware
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("GetMe Error:", error); // Added detailed logging
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
