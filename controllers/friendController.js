const Friendship = require('../models/Friendship');
const User = require('../models/User');

/**
 * @desc    Search for users by display name
 * @route   GET /api/friends/search?q=...
 * @access  Private
 */
exports.searchUsers = async (req, res) => {
  const query = req.query.q;

  // Return error if query string is missing
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const users = await User.find({
      // Case-insensitive regex search on displayName
      displayName: { $regex: query, $options: 'i' },
      // Exclude the logged-in user from the search results
      _id: { $ne: req.user.id }
    })
    .select('displayName email _id') // Return only specific fields
    .limit(10); // Limit results for performance

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Send a friend request to another user
 * @route   POST /api/friends/request
 * @access  Private
 */
exports.sendFriendRequest = async (req, res) => {
  const { recipientId } = req.body;
  const requesterId = req.user.id;

  // Prevent users from sending a request to themselves
  if (requesterId === recipientId) {
    return res.status(400).json({ message: 'Cannot send a friend request to yourself' });
  }

  try {
    // Always sort user IDs to keep order consistent in DB
    const users = [requesterId, recipientId].sort();

    // Check if a friendship or request already exists between these two users
    const existingFriendship = await Friendship.findOne({ users });

    if (existingFriendship) {
      return res.status(400).json({ message: 'Friendship already exists or is pending' });
    }

    // Create a new friend request
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

/**
 * @desc    Accept or decline a friend request
 * @route   PUT /api/friends/request/:id
 * @access  Private
 */
exports.respondToRequest = async (req, res) => {
  const { status } = req.body; // Expected: 'accepted' or 'declined'
  const friendshipId = req.params.id;
  const userId = req.user.id;

  // Validate status input
  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const friendship = await Friendship.findById(friendshipId);

    // Return error if request doesn't exist
    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Ensure that only the recipient can respond to the request
    if (friendship.recipient.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update the status of the request
    friendship.status = status;
    await friendship.save();

    res.json(friendship);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all accepted friends and pending requests (both incoming and sent)
 * @route   GET /api/friends
 * @access  Private
 */
exports.getFriendsAndRequests = async (req, res) => {
  const userId = req.user.id;

  try {
    // Find all friendships that include the current user
    const friendships = await Friendship.find({ users: userId })
      .populate('requester', 'displayName email') // Show requester info
      .populate('recipient', 'displayName email'); // Show recipient info

    // Split the results based on the friendship status and user role
    const friends = friendships.filter(f => f.status === 'accepted');
    const incomingRequests = friendships.filter(f => f.status === 'pending' && f.recipient._id.equals(userId));
    const sentRequests = friendships.filter(f => f.status === 'pending' && f.requester._id.equals(userId));

    res.json({ friends, incomingRequests, sentRequests });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Cancel a pending friend request or remove an existing friendship
 * @route   DELETE /api/friends/:id
 * @access  Private
 */
exports.removeFriendship = async (req, res) => {
  const friendshipId = req.params.id;
  const userId = req.user.id;

  try {
    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    // Check that the user is part of this friendship
    if (!friendship.users.includes(userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await friendship.deleteOne();
    res.json({ message: 'Friendship removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
