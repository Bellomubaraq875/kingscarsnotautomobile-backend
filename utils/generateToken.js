// =============================================
// KingsCarNotAutomobile - JWT Token Generator
// =============================================

const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for a given user.
 *
 * @param {Object} payload - Data to encode in the token (typically user id and role)
 * @param {string} payload.id - The user's MongoDB ObjectId (as string)
 * @param {string} payload.role - The user's role ('user' | 'admin')
 * @returns {string} - Signed JWT token string
 */
const generateToken = ({ id, role }) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign(
        {
            id,   // Will be used by authMiddleware to look up the user
            role, // Stored for quick role checks without extra DB queries
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d', // Token expires in 7 days by default
        }
    );

    return token;
};

module.exports = generateToken;