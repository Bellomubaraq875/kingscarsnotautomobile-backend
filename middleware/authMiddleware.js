// =============================================
// KingsCarNotAutomobile - Auth & Admin Middleware
// =============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// =============================================
// protect — Verifies JWT and attaches user to request
// =============================================
// Use this middleware on any route that requires authentication.
// It reads the Bearer token from the Authorization header,
// verifies it, fetches the user from DB, and attaches to req.user.
const protect = async (req, res, next) => {
    let token;

    // Check if Authorization header exists and starts with "Bearer"
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        // Extract the token after "Bearer "
        token = req.headers.authorization.split(' ')[1];
    }

    // If no token is found, deny access immediately
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided. Please log in.',
        });
    }

    try {
        // Verify and decode the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the user from the database using the id embedded in the token.
        // We explicitly select the password field as false (it's already excluded by default,
        // but this makes it explicit and safe).
        const user = await User.findById(decoded.id).select('-password');

        // If user no longer exists (e.g. was deleted after token was issued)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'The user associated with this token no longer exists.',
            });
        }

        // Attach the full user document to the request object
        // so downstream controllers can access it via req.user
        req.user = user;

        next();
    } catch (error) {
        // Catch invalid signature, malformed token, or expiry
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Your session has expired. Please log in again.',
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid token. Authentication failed.',
        });
    }
};

// =============================================
// adminOnly — Restricts access to admin users only
// =============================================
// MUST be used AFTER the `protect` middleware, since it
// relies on req.user being populated by protect first.
//
// Usage in routes: router.get('/admin-only', protect, adminOnly, controller)
const adminOnly = (req, res, next) => {
    if (!req.user) {
        // This should not happen if protect ran first, but is a safety net
        return res.status(401).json({
            success: false,
            message: 'Not authenticated.',
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admins only.',
        });
    }

    next();
};

module.exports = { protect, adminOnly };