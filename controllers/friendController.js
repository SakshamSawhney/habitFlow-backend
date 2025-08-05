const Friendship = require('../models/Friendship');
const User = require('../models/User');

// @desc    Search for users by display name
// @route   GET /api/friends/search?q=...
exports.searchUsers = async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const users = await User.find({
      displayName: { $regex: query, $options: 'i' },
      _id: { $ne: req.user.id } // Exclude current user
    }).select('displayName email _id').limit(10);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send a friend request
// @route   POST /api/friends/request
exports.sendFriendRequest = async (req, res) => {
  const { recipientId } = req.body;
  const requesterId = req.user.id;

  if (requesterId === recipientId) {
    return res.status(400).json({ message: 'Cannot send a friend request to yourself' });
  }

  try {
    const users = [requesterId, recipientId].sort();
    const existingFriendship = await Friendship.findOne({ users });

    if (existingFriendship) {
      return res.status(400).json({ message: 'Friendship already exists or is pending' });
    }

    const newFriendship = await Friendship.create({
      users,
      requester: requesterId,
      recipient: recipientId,
      status: 'pending',
    });

    res.status(201).json(newFriendship);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Respond to a friend request (accept/decline)
// @route   PUT /api/friends/request/:id
exports.respondToRequest = async (req, res) => {
  const { status } = req.body; // 'accepted' or 'declined'
  const friendshipId = req.params.id;
  const userId = req.user.id;

  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    if (friendship.recipient.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    friendship.status = status;
    await friendship.save();

    res.json(friendship);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all friends, incoming and outgoing requests
// @route   GET /api/friends
exports.getFriendsAndRequests = async (req, res) => {
  const userId = req.user.id;
  try {
    const friendships = await Friendship.find({ users: userId })
      .populate('requester', 'displayName email')
      .populate('recipient', 'displayName email');

    const friends = friendships.filter(f => f.status === 'accepted');
    const incomingRequests = friendships.filter(f => f.status === 'pending' && f.recipient._id.equals(userId));
    const sentRequests = friendships.filter(f => f.status === 'pending' && f.requester._id.equals(userId));

    res.json({ friends, incomingRequests, sentRequests });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove a friend or cancel a request
// @route   DELETE /api/friends/:id
exports.removeFriendship = async (req, res) => {
  const friendshipId = req.params.id;
  const userId = req.user.id;

  try {
    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }
    if (!friendship.users.includes(userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await friendship.deleteOne();
    res.json({ message: 'Friendship removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};