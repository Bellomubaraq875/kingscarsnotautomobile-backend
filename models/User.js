// =============================================
// KingsCarNotAutomobile - User Model
// =============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// =============================================
// User Schema Definition
// =============================================
const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide your full name'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },

        email: {
            type: String,
            required: [true, 'Please provide an email address'],
            unique: true, // Enforced at the DB index level
            lowercase: true, // Always store email in lowercase
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ],
        },

        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // IMPORTANT: Never return password in queries by default
        },

        role: {
            type: String,
            enum: {
                values: ['user', 'admin'],
                message: 'Role must be either "user" or "admin"',
            },
            default: 'user', // All new users are regular users unless promoted
        },
    },
    {
        // Automatically adds createdAt and updatedAt fields
        timestamps: true,
    }
);

// =============================================
// Pre-save Hook: Hash password before saving
// =============================================
// This runs before every .save() call.
// We only re-hash if the password field was actually modified,
// preventing unnecessary rehashing on profile updates.
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    // Generate a salt with cost factor 12 (good balance of security and performance)
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// =============================================
// Instance Method: Compare entered password with hashed password
// =============================================
// Called as: user.comparePassword(enteredPassword)
UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// =============================================
// Instance Method: Return safe user object (no password)
// =============================================
// Useful when you want to manually serialize user data in responses
UserSchema.methods.toSafeObject = function () {
    return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

module.exports = mongoose.model('User', UserSchema);