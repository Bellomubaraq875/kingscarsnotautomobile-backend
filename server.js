// =============================================
// KingsCarNotAutomobile - Main Server Entry Point
// =============================================

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables from .env file BEFORE anything else
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

// Initialize Express application
const app = express();

// =============================================
// Global Middleware
// =============================================

// Enable CORS - allows frontend (e.g. Next.js on port 3000) to communicate with this API
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-production-domain.com']  // Replace with your actual frontend URL in production
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true, // Allow cookies and auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies (for form submissions)
app.use(express.urlencoded({ extended: false }));

// =============================================
// API Routes
// =============================================

// Auth Routes - handles /api/auth/register, /api/auth/login, /api/auth/me
app.use('/api/auth', require('./routes/authRoutes'));

// =============================================
// Root Health Check Endpoint
// =============================================
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'KingsCarNotAutomobile API is running',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
    });
});

// =============================================
// 404 Handler - Catch-all for unknown routes
// =============================================
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// =============================================
// Global Error Handler
// Must have 4 parameters (err, req, res, next) for Express to treat it as error middleware
// =============================================
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.stack);

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: messages.join(', '),
        });
    }

    // Handle Mongoose duplicate key errors (e.g. duplicate email)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `An account with that ${field} already exists`,
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Please log in again.',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Your session has expired. Please log in again.',
        });
    }

    // Default: Internal Server Error
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

// =============================================
// Start Server
// =============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚗 KingsCarNotAutomobile API Server`);
    console.log(`🌍 Environment : ${process.env.NODE_ENV}`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Base URL    : http://localhost:${PORT}\n`);
});