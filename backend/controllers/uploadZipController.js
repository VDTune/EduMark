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
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const uploadZipController = async (req, res) => {
  let extractFolder = null;

  try {
    const assignmentId = req.body.assignmentId || req.params.assignmentId;

    if (!assignmentId) {
      return res.status(400).json({ message: "Thiếu assignmentId" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Không có file ZIP" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Không tìm thấy assignment" });
    }

    // 1️⃣ Giải nén ZIP
    const zipPath = req.file.path;
    const zipName = path.basename(zipPath, path.extname(zipPath));
    extractFolder = path.join(process.cwd(), "uploads", zipName);

    fs.mkdirSync(extractFolder, { recursive: true });

    await fs
      .createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractFolder }))
      .promise();

    // Xóa file zip NGAY sau khi giải nén
    fs.unlinkSync(zipPath);

    // 2️⃣ Nếu ZIP có 1 folder bọc ngoài
    const rootDirs = fs
      .readdirSync(extractFolder)
      .filter(f => fs.statSync(path.join(extractFolder, f)).isDirectory());

    let baseFolder = extractFolder;
    if (rootDirs.length === 1) {
      baseFolder = path.join(extractFolder, rootDirs[0]);
    }

    // 3️⃣ Lấy danh sách học sinh trong DB (1 lớp ~ rất ít → OK)
    const students = await User.find({ role: "student" });

    const createdSubmissions = [];

    // 4️⃣ Duyệt từng folder học sinh (THEO TÊN)
    const studentFolders = fs
      .readdirSync(baseFolder)
      .filter(f => fs.statSync(path.join(baseFolder, f)).isDirectory());

    for (const folderName of studentFolders) {
      const studentFolderPath = path.join(baseFolder, folderName);

      // 🔑 MAP THEO TÊN (SO SÁNH MỀM)
      const student = students.find(
        s => normalize(s.name) === normalize(folderName)
      );

      if (!student) {
        console.warn(`⚠️ Không tìm thấy học sinh theo tên: ${folderName}`);
        continue;
      }

      const imageFiles = fs
        .readdirSync(studentFolderPath)
        .filter(f => /\.(jpg|jpeg|png)$/i.test(f));

      if (imageFiles.length === 0) continue;

      const uploadedUrls = [];

      // 5️⃣ Upload ảnh lên Cloudinary → TẠO FOLDER THEO TÊN HỌC SINH
      for (const img of imageFiles) {
        const imgPath = path.join(studentFolderPath, img);

        const cloudinaryFolder = `${process.env.CLOUDINARY_FOLDER_RAW}/${folderName}`;

        const { url } = await uploadImageToCloudinary(
          imgPath,
          cloudinaryFolder
        );

        uploadedUrls.push(url);

        // Xóa ảnh local sau upload
        fs.unlinkSync(imgPath);
      }

      // 6️⃣ Tạo submission
      const submission = await Submission.create({
        assignmentId,
        studentId: student._id,
        content: "Nộp bài qua ZIP do giáo viên upload",
        fileUrl: uploadedUrls,
        submittedAt: new Date(),
      });

      createdSubmissions.push({
        submission,
        files: uploadedUrls,
      });
    }

    // 7️⃣ Trả response cho frontend
    res.json({
      success: true,
      message: "Đã xử lý ZIP và tạo bài nộp",
      total: createdSubmissions.length,
    });

    // 8️⃣ Chạy AI ở background (KHÔNG BLOCK)
    if (assignment.answerKey) {
      for (const item of createdSubmissions) {
        runAiGradingInBackground(
          item.submission._id,
          item.files,
          assignment.answerKey
        ).catch(err =>
          console.error(
            `❌ Lỗi AI submission ${item.submission._id}:`,
            err
          )
        );
      }
    }
  } catch (err) {
    console.error("❌ Upload ZIP error:", err);
    return res.status(500).json({ message: "Lỗi xử lý ZIP" });
  } finally {
    // 9️⃣ Dọn folder giải nén
    if (extractFolder && fs.existsSync(extractFolder)) {
      try {
        fs.rmSync(extractFolder, { recursive: true, force: true });
        console.log(`🧹 Đã dọn folder: ${extractFolder}`);
      } catch (e) {
        console.warn(`Không thể dọn folder ${extractFolder}:`, e.message);
      }
    }

    // 10️⃣ Dọn ZIP phòng trường hợp lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};
