const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all skills
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'skills');
    const skills = [...new Set(users.flatMap(user => user.skills.map(skill => skill.name)))];
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get skills by level
router.get('/level/:level', auth, async (req, res) => {
  try {
    const users = await User.find({
      'skills.level': req.params.level
    }, 'skills');
    const skills = [...new Set(users.flatMap(user => 
      user.skills
        .filter(skill => skill.level === req.params.level)
        .map(skill => skill.name)
    ))];
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search skills
router.get('/search', auth, async (req, res) => {
  try {
    const searchTerm = req.query.q;
    const users = await User.find({
      'skills.name': { $regex: searchTerm, $options: 'i' }
    }, 'skills');
    const skills = [...new Set(users.flatMap(user => 
      user.skills
        .filter(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(skill => skill.name)
    ))];
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 