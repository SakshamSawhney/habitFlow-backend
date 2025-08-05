const mongoose = require('mongoose');

const FriendshipSchema = new mongoose.Schema({
  // To make querying easier, we store the two users in a sorted array
  // and ensure the combination is unique.
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  // The user who sent the request
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // The user who will receive the request
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending',
  },
}, { timestamps: true });

// Ensure a friendship between two users is unique
FriendshipSchema.index({ users: 1 }, { unique: true });

module.exports = mongoose.model('Friendship', FriendshipSchema);