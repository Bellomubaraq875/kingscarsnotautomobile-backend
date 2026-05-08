// =============================================
// KingsCarNotAutomobile - MongoDB Atlas Connection
// =============================================

const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using the MONGO_URI from environment variables.
 * Exits the process if the connection fails — we cannot run without a database.
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // These options suppress deprecation warnings and ensure stable connections
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);

        // Exit process with failure code — no point running the server without a DB
        process.exit(1);
    }
};

module.exports = connectDB;