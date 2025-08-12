const Friendship = require('../models/Friendship');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.searchUsers = async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  try {
    const users = await User.find({
      displayName: { $regex: query, $options: 'i' },
      _id: { $ne: req.user.id }
    }).select('displayName email _id').limit(10);
    res.json(users);
  } catch (error) {
    console.error("Search Users Error:", error);
    res.status(500).json({ message: 'Server error during user search' });
  }
};

exports.sendFriendRequest = async (req, res) => {
  const { recipientId } = req.body;
  
  if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'A valid Recipient ID is required.' });
  }

  const requesterId = req.user.id;

  if (requesterId === recipientId) {
    return res.status(400).json({ message: 'You cannot send a friend request to yourself.' });
  }

  try {
    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
        return res.status(404).json({ message: 'The user you are trying to add does not exist.' });
    }

    const users = [requesterId, recipientId].sort();
    
    // --- NEW, SIMPLER, AND MORE ROBUST LOGIC ---
    const existingFriendship = await Friendship.findOne({ users });

    if (existingFriendship) {
        // If a request is already pending or accepted, stop.
        if (existingFriendship.status === 'accepted' || existingFriendship.status === 'pending') {
            return res.status(400).json({ message: 'A friendship or pending request already exists.' });
        }
        // If it was declined or blocked, we remove the old record to allow a new request.
        // This is much safer than trying to update the old record.
        await Friendship.findByIdAndDelete(existingFriendship._id);
    }

    // At this point, we are clear to create a new, clean friend request.
    const newFriendship = await Friendship.create({
        users,
        requester: requesterId,
        recipient: recipientId,
        status: 'pending',
    });

    return res.status(201).json(newFriendship);

  } catch (error) {
    console.error("Send Friend Request Error:", error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};

exports.respondToRequest = async (req, res) => {
  const { status } = req.body;
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
      return res.status(401).json({ message: 'Not authorized to respond to this request' });
    }
    if (friendship.status !== 'pending') {
        return res.status(400).json({ message: 'This request has already been responded to.' });
    }

    friendship.status = status;
    await friendship.save();

    res.json(friendship);
  } catch (error) {
    console.error("Respond to Request Error:", error);
    res.status(500).json({ message: 'Server error while responding to request' });
  }
};

exports.getFriendsAndRequests = async (req, res) => {
  const userId = req.user.id;
  try {
    const friendships = await Friendship.find({ users: userId })
      .populate('requester', 'displayName email _id avatarUrl')
      .populate('recipient', 'displayName email _id avatarUrl');

    const friends = friendships.filter(f => f.status === 'accepted');
    const incomingRequests = friendships.filter(f => f.status === 'pending' && f.recipient._id.equals(userId));
    const sentRequests = friendships.filter(f => f.status === 'pending' && f.requester._id.equals(userId));

    res.json({ friends, incomingRequests, sentRequests });
  } catch (error) {
    console.error("Get Friends Error:", error);
    res.status(500).json({ message: 'Server error while fetching friends data' });
  }
};

exports.removeFriendship = async (req, res) => {
  const friendshipId = req.params.id;
  const userId = req.user.id;

  try {
    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }
    if (!friendship.users.includes(userId)) {
      return res.status(401).json({ message: 'Not authorized to remove this friendship' });
    }

    await friendship.deleteOne();
    res.json({ message: 'Friendship removed' });
  } catch (error) {
    console.error("Remove Friendship Error:", error);
    res.status(500).json({ message: 'Server error while removing friendship' });
  }
};
