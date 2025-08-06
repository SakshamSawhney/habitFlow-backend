const mongoose = require('mongoose');

// Define the schema for the Friendship collection
const FriendshipSchema = new mongoose.Schema({
  // Store the two users involved in the friendship in a sorted array.
  // This makes querying symmetric friendships (regardless of order) easier.
  // Example: [userA, userB] === [userB, userA] when sorted.
  users: [{
    type: mongoose.Schema.Types.ObjectId, // Reference to User model
    ref: 'User',
    required: true,
  }],
  
  // The user who initiates the friend request
  requester: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User model
    ref: 'User',
    required: true,
  },

  // The user who receives the friend request
  recipient: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User model
    ref: 'User',
    required: true,
  },

  // Status of the friendship request
  // 'pending' - request sent but not yet accepted or declined
  // 'accepted' - request accepted, users are now friends
  // 'declined' - request declined by the recipient
  // 'blocked' - one of the users has blocked the other
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending',
  },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

// Create a unique index on the 'users' array
// This ensures that a friendship between the same two users can only exist once
FriendshipSchema.index({ users: 1 }, { unique: true });

// Export the Friendship model
module.exports = mongoose.model('Friendship', FriendshipSchema);
