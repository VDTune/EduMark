import express from "express";
import { updateSubmission, submitAssignment, getSubmissionsByAssignment, getMySubmissions, gradeSubmission } from "../controllers/submissionController.js";
import authMiddleware from "../middleware/auth.js";
import { uploadZip } from "../middleware/uploadZip.js";
import { uploadZipController } from "../controllers/uploadZipController.js";
import { upload } from "../middleware/upload.js"; 

const router = express.Router();

console.log("Submission routes registered");

// Nộp bài mới (Field name: "images")
router.post("/submit", authMiddleware, upload.array("images"), submitAssignment); 

// Cập nhật bài nộp (Field name: "images")
router.put("/:id", authMiddleware, upload.array("images"), updateSubmission);

router.post("/upload-zip", authMiddleware, uploadZip.single("zipfile"), uploadZipController);
router.get("/assignment/:assignmentId", authMiddleware, getSubmissionsByAssignment);
router.get("/mine", authMiddleware, getMySubmissions);
router.post("/:id/grade", authMiddleware, gradeSubmission);

export default router;