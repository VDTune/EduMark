import express from "express";
import { updateSubmission, submitAssignment, getSubmissionsByAssignment, getMySubmissions, gradeSubmission } from "../controllers/submissionController.js";
import authMiddleware from "../middleware/auth.js";
import { uploadZip } from "../middleware/uploadZip.js";
import { uploadZipController } from "../controllers/uploadZipController.js";
import multer from "multer";
import path from "path";
import fs from "fs"; // Thêm import fs để tạo thư mục

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads"); // Chỉ dùng "uploads" trực tiếp
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Tạo thư mục nếu không tồn tại
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Sử dụng uploadDir
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const router = express.Router();

console.log("Submission routes registered");

// @desc   Submit an assignment
// @route  POST /api/submissions/submit
// @access Private (student)
router.post("/submit", authMiddleware, upload.array("file"), submitAssignment);

// @desc   Update a submission
// @route  PUT /api/submissions/:id
// @access Private (student)
router.put("/:id", authMiddleware, upload.array("file"), updateSubmission);

// @desc   Upload assignment via ZIP
// @route  POST /api/submissions/upload-zip
// @access Private (teacher)
router.post("/upload-zip", authMiddleware, uploadZip.single("zipfile"), uploadZipController);

// @desc   Get all submissions for an assignment
// @route  GET /api/submissions/assignment/:assignmentId
// @access Private (teacher)
router.get("/assignment/:assignmentId", authMiddleware, getSubmissionsByAssignment);

// @desc   Get my submissions
// @route  GET /api/submissions/mine
// @access Private (student)
router.get("/mine", authMiddleware, getMySubmissions);

// @desc   Grade a submission
// @route  POST /api/submissions/:id/grade
// @access Private (teacher)
router.post("/:id/grade", authMiddleware, gradeSubmission);

export default router;