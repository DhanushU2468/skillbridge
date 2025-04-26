const express = require('express');
const SkillExchange = require('../models/SkillExchange');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Create skill exchange request
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, offeredSkill, requestedSkill, duration, notes } = req.body;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create exchange request
    const exchange = new SkillExchange({
      requester: req.user._id,
      receiver: receiverId,
      offeredSkill,
      requestedSkill,
      duration,
      notes
    });

    await exchange.save();
    res.status(201).json(exchange);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's skill exchanges
router.get('/my-exchanges', auth, async (req, res) => {
  try {
    const exchanges = await SkillExchange.find({
      $or: [{ requester: req.user._id }, { receiver: req.user._id }]
    })
    .populate('requester', 'username profile.firstName profile.lastName')
    .populate('receiver', 'username profile.firstName profile.lastName')
    .sort({ createdAt: -1 });

    res.json(exchanges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update skill exchange status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const exchange = await SkillExchange.findById(req.params.id);

    if (!exchange) {
      return res.status(404).json({ message: 'Exchange not found' });
    }

    // Verify user is either requester or receiver
    if (exchange.requester.toString() !== req.user._id.toString() && 
        exchange.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    exchange.status = status;
    await exchange.save();

    // If exchange is completed, update user stats
    if (status === 'completed') {
      await User.findByIdAndUpdate(exchange.requester, {
        $inc: { completedExchanges: 1 }
      });
      await User.findByIdAndUpdate(exchange.receiver, {
        $inc: { completedExchanges: 1 }
      });
    }

    res.json(exchange);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add feedback to exchange
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const exchange = await SkillExchange.findById(req.params.id);

    if (!exchange) {
      return res.status(404).json({ message: 'Exchange not found' });
    }

    // Determine if user is requester or receiver
    const isRequester = exchange.requester.toString() === req.user._id.toString();
    const feedbackField = isRequester ? 'requesterRating' : 'receiverRating';

    // Add feedback
    exchange.feedback[feedbackField] = {
      rating,
      comment,
      date: new Date()
    };

    await exchange.save();

    // Update user's average rating
    const user = await User.findById(isRequester ? exchange.receiver : exchange.requester);
    const userExchanges = await SkillExchange.find({
      $or: [
        { requester: user._id, 'feedback.requesterRating.rating': { $exists: true } },
        { receiver: user._id, 'feedback.receiverRating.rating': { $exists: true } }
      ]
    });

    const totalRating = userExchanges.reduce((sum, ex) => {
      const rating = isRequester ? 
        ex.feedback.requesterRating?.rating || 0 : 
        ex.feedback.receiverRating?.rating || 0;
      return sum + rating;
    }, 0);

    user.rating = {
      average: totalRating / userExchanges.length,
      count: userExchanges.length
    };

    await user.save();
    res.json(exchange);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 