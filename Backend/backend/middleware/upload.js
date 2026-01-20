// middleware/upload.js
import multer, { memoryStorage } from 'multer';

const storage = memoryStorage();

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 8                     // max number of files per request
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (jpg, png, webp) are allowed'));
  }
});

export default upload;
