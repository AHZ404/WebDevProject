// middleware/upload.js (or similar file)

const multer = require('multer');
const path = require('path');

// 1. Define storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure the 'uploads' folder exists
    },
    filename: (req, file, cb) => {
        // Create a unique filename for the upload
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. Initialize multer instance
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Optional limit: 5MB
});

// 3. Export the initialized instance (crucial step!)
module.exports = upload; 
// When you require this file, the 'upload' object will contain methods like .single(), .array(), etc.