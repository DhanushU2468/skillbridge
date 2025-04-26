const mongoose = require('mongoose');

const skillExchangeSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offeredSkill: {
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true
    }
  },
  requestedSkill: {
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  scheduledDate: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  meetingLink: {
    type: String
  },
  notes: {
    type: String
  },
  feedback: {
    requesterRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      date: Date
    },
    receiverRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      date: Date
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
skillExchangeSchema.index({ requester: 1, receiver: 1 });
skillExchangeSchema.index({ status: 1 });

const SkillExchange = mongoose.model('SkillExchange', skillExchangeSchema);

module.exports = SkillExchange; 