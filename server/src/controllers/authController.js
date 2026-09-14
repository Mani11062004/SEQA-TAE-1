const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// User Registration
async function register(req, res) {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'All fields (username, email, password, full_name) are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Role validation - restrict to allowed roles
    const validRoles = ['admin', 'reviewer', 'developer'];
    const assignedRole = validRoles.includes(role) ? role : 'reviewer';

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email.toLowerCase(), username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const colors = ['#0284c7', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, role, avatar_color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, full_name, role, avatar_color, created_at`,
      [username.trim(), email.toLowerCase().trim(), passwordHash, full_name.trim(), assignedRole, avatarColor]
    );

    const newUser = result.rows[0];
    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('[Auth Error] Register:', err);
    return res.status(500).json({ error: 'Registration failed due to internal server error.' });
  }
}

// User Login
async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Please enter username/email and password.' });
    }

    const userRes = await query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR username = $1 LIMIT 1`,
      [emailOrUsername.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user);
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_color: user.avatar_color,
      created_at: user.created_at
    };

    return res.json({
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Error] Login:', err);
    return res.status(500).json({ error: 'Login failed due to internal server error.' });
  }
}

// Quick Demo Role Switcher (Convenient for viva & presentations)
async function demoLogin(req, res) {
  try {
    const { role } = req.params;
    const validRoles = ['admin', 'reviewer', 'developer'];
    const targetRole = validRoles.includes(role) ? role : 'admin';

    const userRes = await query(
      `SELECT id, username, email, full_name, role, avatar_color, created_at 
       FROM users 
       WHERE role = $1 
       ORDER BY id ASC LIMIT 1`,
      [targetRole]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: `No demo account found with role ${targetRole}.` });
    }

    const user = userRes.rows[0];
    const token = generateToken(user);

    return res.json({
      message: `Switched demo role to ${user.role}.`,
      token,
      user
    });
  } catch (err) {
    console.error('[Auth Error] Demo Login:', err);
    return res.status(500).json({ error: 'Demo switch failed.' });
  }
}

// Current User Profile
async function getMe(req, res) {
  return res.json({ user: req.user });
}

// List Users for Review Assignments
async function getUsers(req, res) {
  try {
    const result = await query(
      `SELECT id, username, email, full_name, role, avatar_color, created_at 
       FROM users 
       ORDER BY role ASC, full_name ASC`
    );
    return res.json({ users: result.rows });
  } catch (err) {
    console.error('[Auth Error] GetUsers:', err);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
}

module.exports = {
  register,
  login,
  demoLogin,
  getMe,
  getUsers
};
