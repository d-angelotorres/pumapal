// server/index.js
require('dotenv').config(); // This loads variables from .env

// Import required packages
const express = require('express');          // Web framework
const mongoose = require('mongoose');        // MongoDB helper
const cors = require('cors');                // Allows frontend/backend to talk

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware setup to allow all origins (adjust later for security)
const corsOptions = {
  origin: '*',  // Allow all origins. Adjust for security as needed.
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));  // Use CORS options
app.use(express.json());                     // Parse incoming JSON data
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Connect study group routes
const studyGroupRoutes = require('./routes/studyGroups');
app.use('/api/study-groups', studyGroupRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// TEST ROUTE
app.get('/', (req, res) => {
    console.log('🌐 GET / hit');
    res.send('🎉 PumaPal backend is running!');
});

// Add a middleware to log routes accessed
app.use('/api/study-groups', (req, res, next) => {
  console.log("🚨 Route /api/study-groups accessed");
  next();
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});
