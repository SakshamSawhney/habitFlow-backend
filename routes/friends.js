const express = require('express');
const router = express.Router();
const {
  searchUsers,
  sendFriendRequest,
  respondToRequest,
  getFriendsAndRequests,
  removeFriendship
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/search', searchUsers);
router.get('/', getFriendsAndRequests);
router.post('/request', sendFriendRequest);
router.put('/request/:id', respondToRequest);
router.delete('/:id', removeFriendship);

module.exports = router;