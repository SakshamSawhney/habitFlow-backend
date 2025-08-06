const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv =require('dotenv');

dotenv.config();

const authRoutes = require('../routes/auth');
const habitRoutes = require('../routes/habits');
const friendRoutes = require('../routes/friends');
const analyticsRoutes = require('../routes/analytics');
const profileRoutes = require('../routes/profile'); // <-- ADDED

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch((error) => console.error('MongoDB Connection Error:', error));

// API Routes
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes); // <-- ADDED

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

module.exports = app;
