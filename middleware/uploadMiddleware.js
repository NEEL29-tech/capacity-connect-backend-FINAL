const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createStorage = (folder) => {
    const uploadPath = path.join(__dirname, "..", "uploads", folder);

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadPath);
        },

        filename: (req, file, cb) => {
            const extension = path.extname(file.originalname).toLowerCase();

            const filename =
                `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

            cb(null, filename);
        }
    });
};


// PDF Upload
const uploadPDF = multer({
    storage: createStorage("pdfs"),

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (extension !== ".pdf") {
            return cb(new Error("Only PDF files are allowed"));
        }

        cb(null, true);
    }
});


// Assignment Upload
const uploadAssignment = multer({
    storage: createStorage("assignments"),

    limits: {
        fileSize: 20 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedExtensions = [
            ".pdf",
            ".doc",
            ".docx",
            ".zip",
            ".jpg",
            ".jpeg",
            ".png"
        ];

        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            return cb(
                new Error(
                    "Allowed files: PDF, DOC, DOCX, ZIP, JPG, JPEG, PNG"
                )
            );
        }

        cb(null, true);
    }
});


module.exports = {
    uploadPDF,
    uploadAssignment
};