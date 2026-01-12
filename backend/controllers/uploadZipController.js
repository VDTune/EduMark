// backend/controllers/uploadZipController.js
import fs from "fs";
import path from "path";
import unzipper from "unzipper";

import Assignment from "../models/assignmentModel.js";
import Submission from "../models/submissionModel.js";
import User from "../models/userModel.js";

import { uploadImageToCloudinary } from "../utils/cloudinaryUpload.js";
import { runAiGradingInBackground } from "./submissionController.js";

const normalize = (str) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const uploadZipController = async (req, res) => {
  let extractFolder = null;

  try {
    const assignmentId = req.body.assignmentId || req.params.assignmentId;
    if (!assignmentId) return res.status(400).json({ message: "Thiếu assignmentId" });
    if (!req.file) return res.status(400).json({ message: "Không có file ZIP" });

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Không tìm thấy assignment" });

    // 1️⃣ Giải nén ZIP
    const zipPath = req.file.path;
    extractFolder = path.join(process.cwd(), "uploads", path.basename(zipPath, ".zip"));
    fs.mkdirSync(extractFolder, { recursive: true });

    await fs.createReadStream(zipPath).pipe(unzipper.Extract({ path: extractFolder })).promise();
    fs.unlinkSync(zipPath);

    // 2️⃣ Xử lý folder gốc
    const rootDirs = fs.readdirSync(extractFolder).filter(f =>
      fs.statSync(path.join(extractFolder, f)).isDirectory()
    );
    const baseFolder = rootDirs.length === 1 ? path.join(extractFolder, rootDirs[0]) : extractFolder;

    const students = await User.find({ role: "student" });
    const submissionsToGrade = [];

    // 3️⃣ Duyệt từng học sinh
    for (const folderName of fs.readdirSync(baseFolder)) {
      const studentFolderPath = path.join(baseFolder, folderName);
      if (!fs.statSync(studentFolderPath).isDirectory()) continue;

      const student = students.find(s => normalize(s.name) === normalize(folderName));
      if (!student) continue;

      const imageFiles = fs.readdirSync(studentFolderPath).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
      if (imageFiles.length === 0) continue;

      const uploadedUrls = [];
      for (const img of imageFiles) {
        const imgPath = path.join(studentFolderPath, img);
        const { url } = await uploadImageToCloudinary(
          imgPath,
          `${process.env.CLOUDINARY_FOLDER_RAW}/${folderName}`
        );
        uploadedUrls.push(url);
        fs.unlinkSync(imgPath);
      }

      // 🔑 UPSERT SUBMISSION
      let submission = await Submission.findOne({ assignmentId, studentId: student._id });

      if (submission) {
        submission.fileUrl = uploadedUrls;
        submission.content = "Nộp bài qua ZIP do giáo viên upload";
        submission.aiScore = null;
        submission.aiFeedback = null;
        submission.aidetail = {};
        submission.submittedAt = new Date();
        await submission.save();
      } else {
        submission = await Submission.create({
          assignmentId,
          studentId: student._id,
          content: "Nộp bài qua ZIP do giáo viên upload",
          fileUrl: uploadedUrls,
          submittedAt: new Date(),
        });
      }

      submissionsToGrade.push({ submission, files: uploadedUrls });
    }

    res.json({ success: true, total: submissionsToGrade.length });

    // 4️⃣ Chạy AI TUẦN TỰ → tránh bài 0 oan
    if (assignment.answerKey) {
      for (const item of submissionsToGrade) {
        await runAiGradingInBackground(
          item.submission._id,
          item.files,
          assignment.answerKey
        );
      }
    }

  } catch (err) {
    console.error("Upload ZIP error:", err);
    res.status(500).json({ message: "Lỗi xử lý ZIP" });
  } finally {
    if (extractFolder && fs.existsSync(extractFolder)) {
      fs.rmSync(extractFolder, { recursive: true, force: true });
    }
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};
