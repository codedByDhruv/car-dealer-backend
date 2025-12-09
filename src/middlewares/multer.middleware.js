const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Make directory if missing
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Multer storage factory
const storageFactory = (subfolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const base = path.join(
        __dirname,
        '..',
        '..',
        process.env.UPLOAD_DIR || 'uploads',
        subfolder
      );
      ensureDir(base);
      cb(null, base);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}-${file.originalname.replace(/\s+/g, '-')}`;
      cb(null, uniqueName);
    },
  });

// Allow only images
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Export upload handlers
const upload = {
  carImages: multer({ storage: storageFactory('cars'), fileFilter }),
  userImage: multer({ storage: storageFactory('users'), fileFilter }),
};

module.exports = upload;
