const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
    }

    res.status(201).json({
      success: true,
      message: "PDF uploaded successfully",
      file: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "PDF upload failed",
      error: error.message,
    });
  }
};


const uploadAssignment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an assignment file",
      });
    }

    res.status(201).json({
      success: true,
      message: "Assignment uploaded successfully",
      file: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Assignment upload failed",
      error: error.message,
    });
  }
};


module.exports = {
  uploadPDF,
  uploadAssignment,
};