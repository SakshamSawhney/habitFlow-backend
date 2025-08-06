// Import the Cloudinary SDK and the Cloudinary storage engine for multer
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
    api_key: process.env.CLOUDINARY_API_KEY,       // API key for authentication
    api_secret: process.env.CLOUDINARY_API_SECRET, // API secret for secure access
});

// Define the storage configuration for multer using Cloudinary
const storage = new CloudinaryStorage({
    cloudinary, // Pass in the configured Cloudinary instance
    params: {
        folder: 'habitflow_avatars',              // Folder name in Cloudinary where files will be stored
        allowed_formats: ['jpeg', 'png', 'jpg'],  // Restrict uploads to specific image formats
    },
});

// Export the configured cloudinary instance and storage engine for use in other files
module.exports = { cloudinary, storage };
