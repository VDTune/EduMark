import fs from "fs";
import path from "path";
import unzipper from "unzipper";
import Submission from "../models/submissionModel.js";
import Assignment from "../models/assignmentModel.js";
import User from "../models/userModel.js";
import { runAiGradingInBackground } from "../controllers/submissionController.js";



export const uploadZipController = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const zipPath = req.file.path;
    const createdSubmissions = [];

    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Only teachers can upload ZIP" });
    }
    if (!assignmentId) {
      return res.status(400).json({ message: "Thiếu assignmentId" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    // Folder đích (dùng tên ZIP gốc)
    const parentFolderName = req.file.originalname.replace(/\.(zip|rar)$/i, "");
    // Folder đích vật lý: uploads/BaiTapLop4A
    const extractFolder = path.join("./uploads", parentFolderName);

    // Tạo folder
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
    if (!fs.existsSync(extractFolder)) fs.mkdirSync(extractFolder);

    //  Giải nén ZIP
    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractFolder }))
      .promise();

    //  Xóa file ZIP tạm sau giải nén
    fs.unlinkSync(zipPath);

    // Kiểm tra nếu giải nén ra 1 thư mục duy nhất, thì di chuyển nội dung lên 1 cấp
    let items = fs.readdirSync(extractFolder);
    if (items.length === 1) {
      const singleFolder = path.join(extractFolder, items[0]);
      if (fs.statSync(singleFolder).isDirectory()) {
        // Di chuyển nội dung của thư mục duy nhất lên cấp cha
        const innerItems = fs.readdirSync(singleFolder);
        for (const item of innerItems) {
          const srcPath = path.join(singleFolder, item);
          const destPath = path.join(extractFolder, item);
          fs.renameSync(srcPath, destPath);
        }
        // Xóa thư mục trống
        fs.rmdirSync(singleFolder);
        console.log(`Đã loại bỏ thư mục wrapper: ${items[0]}`);
      }
    }

    // Quét folder con (mỗi folder = 1 học sinh)
    const studentFolders = fs.readdirSync(extractFolder);

    for (const folderName of studentFolders) {
      const fullPath = path.join(extractFolder, folderName);

      if (!fs.statSync(fullPath).isDirectory()) continue;

      // Tìm student theo tên folder
      const student = await User.findOne({ name: folderName, role: "student" });

      if (!student) {
        console.log("Không tìm thấy học sinh:", folderName);
        continue;
      }

      const files = fs.readdirSync(fullPath)
        .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
        .map(f => `./uploads/${parentFolderName}/${folderName}/${f}`);
      if (files.length === 0) continue;
      // Tạo submission
      const submission = await Submission.create({
        assignmentId,
        studentId: student._id,
        content: "Nộp bài qua Zip do giáo viên upload",
        fileUrl: files,
        submittedAt: new Date()
      });
      createdSubmissions.push({submission, files });
    }

    res.json({
      success: true,
      message: 'Đã gả nén & tạo bài nộp cho học sinh từ file ZIP',
      total: createdSubmissions.length
    });

    if (assignment.answerKey) {
      for (const item of createdSubmissions) {
        runAiGradingInBackground(
          item.submission._id,
          item.files,
          assignment.answerKey
        ).catch(err => console.error(`Lỗi chấm background submission ${item.submission._id}:`, err));
      }
    }

  } catch (err) {
    console.error("Upload ZIP error:", err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Lỗi xử lý ZIP" });
  }
};
