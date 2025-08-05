const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const { getProfile, updateProfile, updateAvatar, getUserProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({ storage });

router.use(protect);

router.get('/', getProfile);
router.get('/:userId', getUserProfile); // New route for friend profiles
router.put('/', updateProfile);
router.put('/avatar', upload.single('avatar'), updateAvatar);

module.exports = router;