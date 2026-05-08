// =============================================
// KingsCarNotAutomobile - Auth Routes
// Base path: /api/auth (mounted in server.js)
// =============================================

const express = require('express');
const router = express.Router();

// Import controller functions
const { register, login, getMe } = require('../controllers/authController');

// Import middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');

// =============================================
// Public Routes (no authentication required)
// =============================================

// @route   POST /api/auth/register
// @desc    Register a new user account
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login and receive a JWT token
// @access  Public
router.post('/login', login);

// =============================================
// Private Routes (authentication required)
// =============================================

// @route   GET /api/auth/me
// @desc    Get the currently logged-in user's profile
// @access  Private
// The `protect` middleware runs first to verify the JWT,
// then `getMe` controller handles the response
router.get('/me', protect, getMe);

// =============================================
// Example Admin-Only Route (template for future use)
// =============================================

// @route   GET /api/auth/admin-test
// @desc    Example of a route restricted to admins only
// @access  Private + Admin
// Uncomment this to test admin middleware:
// router.get('/admin-test', protect, adminOnly, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Welcome, Admin!',
//     data: { user: req.user },
//   });
// });

module.exports = router;