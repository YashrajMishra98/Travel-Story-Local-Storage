// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "uploads/");
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });

// const fileFilter = (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//         cb(null, true);
//     } else {
//         cb(new Error("File type not supported"), false);
//     }
// };


// const upload = multer({ storage: storage });

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