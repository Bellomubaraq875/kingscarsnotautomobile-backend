// =============================================
// KingsCarNotAutomobile - Auth Controller
// Handles: Register, Login, Get Current User
// =============================================

const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// =============================================
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// =============================================
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // --- Input Validation ---
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long',
            });
        }

        // --- Check for existing user ---
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists',
            });
        }

        // --- Create new user ---
        // NOTE: Password is hashed automatically by the pre-save hook in User model
        // NOTE: Role assignment — for security, we only allow 'user' role on public register.
        // Admin role must be assigned manually or through a protected admin route.
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: 'user', // Force 'user' role regardless of what was sent
        });

        // --- Generate JWT ---
        const token = generateToken({ id: user._id, role: user.role });

        // --- Respond with user data + token (never return password) ---
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                user: user.toSafeObject(),
                token,
            },
        });
    } catch (error) {
        console.error('Register Error:', error);

        // Handle Mongoose validation errors (e.g. invalid email format from schema)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
            });
        }

        // Handle MongoDB duplicate key error as a fallback (race condition)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error. Could not register user.',
        });
    }
};

// =============================================
// @desc    Login an existing user
// @route   POST /api/auth/login
// @access  Public
// =============================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // --- Input Validation ---
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your email and password',
            });
        }

        // --- Find user by email ---
        // We must explicitly select password here because it's excluded by default (select: false)
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

        if (!user) {
            // Use a generic message to avoid exposing whether the email exists (security best practice)
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // --- Compare entered password with stored hashed password ---
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // --- Generate JWT ---
        const token = generateToken({ id: user._id, role: user.role });

        // --- Respond with user data + token ---
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toSafeObject(),
                token,
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Could not log in.',
        });
    }
};

// =============================================
// @desc    Get the currently authenticated user
// @route   GET /api/auth/me
// @access  Private (requires valid JWT via protect middleware)
// =============================================
const getMe = async (req, res) => {
    try {
        // req.user is already populated by the protect middleware
        // We re-fetch from DB to get the most up-to-date user data
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: {
                user: user.toSafeObject(),
            },
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Could not retrieve user.',
        });
    }
};

module.exports = { register, login, getMe };