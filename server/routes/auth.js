const express = require('express');
const bcrypt = require('bcryptjs');
const { query, run } = require('../db');
const { authMiddleware, generateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  console.log('REGISTER_HANDLER_ENTER');
  try {
    console.log('REGISTER_TRY_ENTER');
    console.log('Body:', JSON.stringify(req.body));
    const { username, password } = req.body;
    console.log('Register attempt:', username);

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = query('SELECT id FROM users WHERE username = ?', [username]);
    console.log('Existing users:', existing);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Hash generated');

    run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
    console.log('Insert done');

    const users = query('SELECT id, username, created_at FROM users WHERE username = ?', [username]);
    console.log('Query result:', JSON.stringify(users));

    if (users.length === 0) {
      console.error('User not found after insert!');
      return res.status(500).json({ error: 'User creation failed' });
    }
    const user = users[0];
    const token = generateToken(user);

    res.json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'REGISTER_FAIL_V2: ' + (err?.message || String(err)) });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = query('SELECT id, username, password_hash FROM users WHERE username = ?', [username]);
  if (users.length === 0) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const user = users[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username }
  });
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  const users = query('SELECT id, username, created_at FROM users WHERE id = ?', [req.userId]);
  if (users.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: users[0] });
});

module.exports = router;
