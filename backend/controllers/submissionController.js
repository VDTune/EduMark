// backend/controllers/submissionController.js
import Submission from "../models/submissionModel.js";
import Assignment from "../models/assignmentModel.js";
import Classroom from "../models/classroomModel.js";
import { spawn } from "child_process";
import path from "path";
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload.js'
import { ensureLocalImage } from '../utils/ensureLocalImage.js'
import fs from 'fs'

/**
 * Chạy quy trình chấm điểm AI trong nền.
 * @param {string} submissionId - ID của bài nộp cần chấm.
 * @param {string[]} fileUrls - Mảng các đường dẫn tệp của bài nộp.
 * @param {string} answerKey - Đáp án của bài tập.
 */
const runAiGradingInBackground = async (submissionId, fileUrls, answerKey) => {
  try {
    const submission = await Submission.findById(submissionId);
    if (!submission) return;

    // ❌ Giáo viên đã chấm → KHÔNG cho AI ghi đè
    if (submission.grade !== null && submission.gradedBy) {
      console.log("[AI] Skip - teacher already graded");
      return;
    }

    const localPaths = [];
    for (const img of fileUrls) {
      const p = await ensureLocalImage(img);
      localPaths.push(p);
    }

    const aiResult = await executePythonScript(localPaths, answerKey);

    if (!aiResult || aiResult.score === undefined) {
      console.log("[AI] Empty result → skip update");
      return;
    }

    await Submission.findByIdAndUpdate(submissionId, {
      aiScore: aiResult.score,
      aiFeedback: aiResult.comment || "",
      aidetail: aiResult.details || {}
    });

  } catch (err) {
    console.error("[AI] Error:", err);
  }
};


const submitAssignment = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { assignmentId, content, fileUrl: fileUrlFromBody } = req.body;
    const files = req.files;

    if (!assignmentId) {
      return res.status(400).json({ success: false, message: "Missing assignmentId" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const classroom = await Classroom.findById(assignment.classId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (!classroom.students.map(s => s.toString()).includes(studentId)) {
      return res.status(403).json({ success: false, message: "You are not in this class" });
    }
    let fileUrl = []

    if (files && files.length > 0) {
      const uploadedUrls = []

      for (const file of files) {
        // 1. Upload ảnh lên Cloudinary
        const { url } = await uploadImageToCloudinary(
          file.path,
          process.env.CLOUDINARY_FOLDER_RAW
        )

        uploadedUrls.push(url)

        // 2. Xóa file local
        fs.unlinkSync(file.path)
      }

      fileUrl = uploadedUrls
    } else if (fileUrlFromBody) {
      // fallback nếu frontend gửi sẵn URL (hiếm)
      fileUrl = [fileUrlFromBody]
    }

    console.log(
      '[Submit] Files:',
      fileUrl.length > 0 ? { count: fileUrl.length, urls: fileUrl } : 'No file'
    )

    // 1. Lưu bài nộp vào database trước mà không cần chờ AI
    const submission = new Submission({
      assignmentId,
      studentId,
      content,
      fileUrl,
      // Các trường AI sẽ được cập nhật sau
    });
    await submission.save();
    console.log('Đã lưu bài nộp:', { submissionId: submission._id, studentId });

    // 2. Gửi phản hồi thành công cho người dùng ngay lập tức
    res.status(201).json({ success: true, data: submission });

    // 3. Sau khi đã phản hồi, kích hoạt tiến trình AI trong nền (fire-and-forget)
    if (fileUrl.length > 0 && assignment.answerKey) {
      // Không dùng await ở đây để nó chạy ngầm
      runAiGradingInBackground(submission._id, fileUrl, assignment.answerKey);
    }

  } catch (error) {
    console.error("submitAssignment error:", error.message, error.stack);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/**
 * @param {string[]} fileUrls - Mảng các đường dẫn tệp.
 * @param {string} answerKey - Đáp án.
 * @returns {Promise<object>} - Promise giải quyết với kết quả JSON từ script.
 */
const executePythonScript = (fileUrls, answerKey) => {
  return new Promise((resolve) => {
    const PY_TIMEOUT_MS = 600000; // 10 phút
    const pythonScript = path.join(process.cwd(), "ocr_llm", "main_processor.py");
    const args = [pythonScript, fileUrls.join(","), answerKey || ""];

    const pythonProcess = spawn("python", args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONLEGACYWINDOWSSTDIO: 'utf-8'
      }
    });

    let stdoutData = "";
    let stderrData = "";
    let finished = false;

    const timeout = setTimeout(() => {
      if (!finished) {
        console.error("Python process timeout, killing...");
        try { pythonProcess.kill("SIGKILL"); } catch (e) { /* ignore */ }
        resolve({}); // Giải quyết với object rỗng khi timeout
      }
    }, PY_TIMEOUT_MS);

    pythonProcess.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });

    pythonProcess.stderr.on("data", (chunk) => {
      const s = chunk.toString();
      stderrData += s;
      console.error(`[Python stderr] ${s}`);
    });

    pythonProcess.on("close", (code) => {
      finished = true;
      clearTimeout(timeout);
      console.log(`Python process finish with code: ${code}`);

      if (!stdoutData) {
        console.warn("Python không trả về stdout.");
        return resolve({});
      }

      console.log("🔍 RAW STDOUT TỪ PYTHON:", stdoutData);

      try {
        const startMarker = "<<<JSON_START>>>";
        const endMarker = "<<<JSON_END>>>";
        const startIndex = stdoutData.indexOf(startMarker);
        const endIndex = stdoutData.indexOf(endMarker);

        if (startIndex === -1 || endIndex === -1) {
          console.error("❌ KHÔNG TÌM THẤY MARKER JSON!");
          // Fallback: thử tìm một đối tượng JSON bất kỳ trong output
          try {
            const jsonMatch = stdoutData.match(/\{[\s\S]*\}/);
            if (jsonMatch) return resolve(JSON.parse(jsonMatch[0]));
          } catch (e) { }
          return resolve({});
        }

        const jsonString = stdoutData.slice(startIndex + startMarker.length, endIndex).trim();
        console.log("✅ JSON STRING ĐÃ CẮT:", jsonString);
        const parsed = JSON.parse(jsonString);
        return resolve(parsed);

      } catch (parseErr) {
        console.error("❌ LỖI PARSE JSON:", parseErr);
        return resolve({});
      }
    });
  });
};

// PUT /api/submissions/:id (student only)
const updateSubmission = async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { content } = req.body;

    // Tìm bài nộp cũ
    let submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ success: false, message: "Không tìm thấy bài nộp" });

    // Kiểm tra logic resubmitAllowed của Bài tập (Assignment)
    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment.resubmitAllowed) {
      return res.status(400).json({ success: false, message: "Bài tập này không cho phép nộp lại!" });
    }

    // Cập nhật nội dung
    submission.content = content;

    // Nếu có file mới thì cập nhật file
    if (req.files && req.files.length > 0) {
      const uploadedUrls = []

      for (const file of req.files) {
        // 1. Upload ảnh lên Cloudinary
        const { url } = await uploadImageToCloudinary(
          file.path,
          process.env.CLOUDINARY_FOLDER_RAW
        )

        uploadedUrls.push(url)

        // 2. Xóa file local ngay sau khi upload
        fs.unlinkSync(file.path)
      }

      // 3. Lưu URL Cloudinary vào submission
      submission.fileUrl = uploadedUrls
    }

    submission.aiScore = null; // Reset điểm AI
    submission.aiFeedback = null;
    submission.aidetail = [];

    submission.updatedAt = Date.now(); // Cập nhật thời gian
    await submission.save();
    res.json({ success: true, data: submission });

    if (submission.fileUrl && submission.fileUrl.length > 0 && assignment.answerKey) {
      console.log(`[Update] Đang kích hoạt chấm lại cho submission: ${submissionId}`);
      runAiGradingInBackground(submission._id, submission.fileUrl, assignment.answerKey);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/submissions/assignment/:assignmentId  (teacher only: own class)
const getSubmissionsByAssignment = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const assignmentId = req.params.assignmentId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

    const classroom = await Classroom.findById(assignment.classId);
    if (!classroom) return res.status(404).json({ success: false, message: "Class not found" });
    if (classroom.teacher.toString() !== teacherId) return res.status(403).json({ success: false, message: "Not your class" });

    const submissions = await Submission.find({ assignmentId }).populate("studentId", "name email").sort({ submittedAt: -1 });
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error("getSubmissionsByAssignment error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/submissions/mine  (student only)
const getMySubmissions = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const subs = await Submission.find({ studentId })
      .populate("assignmentId", "title classId")
      .populate("gradedBy", "name") // THÊM populate cho giáo viên chấm
      .sort({ submittedAt: -1 });

    console.log('Found submissions:', subs.length); // Debug
    res.json({ success: true, data: subs });
  } catch (error) {
    console.error("getMySubmissions error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/submissions/:id/grade  (teacher only)
const gradeSubmission = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const submissionId = req.params.id;
    const { grade, feedback } = req.body;

    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });

    const assignment = await Assignment.findById(submission.assignmentId);
    const classroom = await Classroom.findById(assignment.classId);
    if (classroom.teacher.toString() !== teacherId) return res.status(403).json({ success: false, message: "Not your class" });

    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedBy = teacherId;
    submission.gradedAt = new Date();
    console.log('Graded submission:', { submissionId, grade, feedback }); // Debug

    await submission.save();
    res.json({ success: true, data: submission });
  } catch (error) {
    console.error("gradeSubmission error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export { updateSubmission, submitAssignment, getSubmissionsByAssignment, getMySubmissions, gradeSubmission, runAiGradingInBackground };
