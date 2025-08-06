const express = require('express');
const router = express.Router();

// Import the controller function that handles analytics logic
const { getAnalytics } = require('../controllers/analyticsController');

// Import authentication middleware to protect the route
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/analytics
// @desc    Get analytics data for the authenticated user (e.g., habit stats, streaks, etc.)
// @access  Private (authentication required)
router.get('/', protect, getAnalytics);

// Export the router to be used in the main application
module.exports = router;
