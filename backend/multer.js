// module.exports = upload;
const multer = require("multer");

// CHANGE: Use memory storage instead of disk storage
const storage = multer.memoryStorage();

// We keep your excellent file filter exactly the same!
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("File type not supported"), false);
    }
};

// Apply the storage and filter
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

module.exports = upload;