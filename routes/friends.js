const express = require('express');
const router = express.Router();

// Import controller functions for handling friendship-related actions
const {
  searchUsers,
  sendFriendRequest,
  respondToRequest,
  getFriendsAndRequests,
  removeFriendship
} = require('../controllers/friendController');

// Import middleware to protect routes (ensures user is authenticated)
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes in this router
router.use(protect);

// @route   GET /api/friends/search
// @desc    Search for users to send friend requests
// @access  Private
router.get('/search', searchUsers);

// @route   GET /api/friends
// @desc    Get current user's friends and friend requests (both sent and received)
// @access  Private
router.get('/', getFriendsAndRequests);

// @route   POST /api/friends/request
// @desc    Send a new friend request
// @access  Private
router.post('/request', sendFriendRequest);

// @route   PUT /api/friends/request/:id
// @desc    Respond to a friend request (accept or decline)
// @access  Private
router.put('/request/:id', respondToRequest);

// @route   DELETE /api/friends/:id
// @desc    Remove a friend or cancel a friend request
// @access  Private
router.delete('/:id', removeFriendship);

// Export the router to be used in the main app
module.exports = router;
