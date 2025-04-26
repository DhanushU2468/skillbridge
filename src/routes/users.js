const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['profile.firstName', 'profile.lastName', 'profile.bio', 'profile.location'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  try {
    updates.forEach(update => {
      const [parent, child] = update.split('.');
      req.user[parent][child] = req.body[update];
    });

    await req.user.save();
    res.json(req.user.getPublicProfile());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add skill
router.post('/skills', auth, async (req, res) => {
  try {
    const { name, level } = req.body;
    req.user.skills.push({ name, level });
    await req.user.save();
    res.status(201).json(req.user.getPublicProfile());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove skill
router.delete('/skills/:skillId', auth, async (req, res) => {
  try {
    req.user.skills = req.user.skills.filter(skill => skill._id.toString() !== req.params.skillId);
    await req.user.save();
    res.json(req.user.getPublicProfile());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add skill to learn
router.post('/skills-to-learn', auth, async (req, res) => {
  try {
    const { name, priority } = req.body;
    req.user.skillsToLearn.push({ name, priority });
    await req.user.save();
    res.status(201).json(req.user.getPublicProfile());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove skill to learn
router.delete('/skills-to-learn/:skillId', auth, async (req, res) => {
  try {
    req.user.skillsToLearn = req.user.skillsToLearn.filter(skill => skill._id.toString() !== req.params.skillId);
    await req.user.save();
    res.json(req.user.getPublicProfile());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Search users by skills
router.get('/search/skills', auth, async (req, res) => {
  try {
    const { skill } = req.query;
    const users = await User.find({
      'skills.name': { $regex: skill, $options: 'i' }
    }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 