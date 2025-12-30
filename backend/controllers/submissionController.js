import Submission from "../models/submissionModel.js";
import Assignment from "../models/assignmentModel.js";
import Classroom from "../models/classroomModel.js";
import { spawn } from "child_process";
import path from "path";

// --- 1. Helper: Gọi Python ---
const executePythonScript = (fileUrls, answerKey) => {
  return new Promise((resolve) => {
    // process.cwd() lấy thư mục gốc của dự án
    const pythonScript = path.join(process.cwd(), "ocr_llm", "main_processor.py");
    
    const args = [pythonScript, fileUrls.join(","), answerKey || ""];
    
    console.log("[Python Executor] Calling Python with:", args);

    // --- SỬA LỖI Ở ĐÂY: Đổi tên biến 'process' thành 'pythonProcess' ---
    const pythonProcess = spawn("python", args); 
    // Lưu ý: Nếu server chạy Linux/Mac, đổi "python" thành "python3"

    let dataStr = "";
    let errorStr = "";

    pythonProcess.stdout.on("data", (data) => {
        dataStr += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
        errorStr += data.toString();
        // Vẫn in ra log để debug, nhưng Python in warning cũng vào đây nên không hẳn là lỗi
        console.error(`[Python Log] ${data}`);
    });
    
    pythonProcess.on("close", (code) => {
        try {
            // Tìm chuỗi JSON nằm giữa 2 thẻ đánh dấu
            const jsonMatch = dataStr.match(/<<<JSON_START>>>([\s\S]*?)<<<JSON_END>>>/);
            if (jsonMatch && jsonMatch[1]) {
                resolve(JSON.parse(jsonMatch[1]));
            } else {
                console.warn("[Python Executor] No JSON found in output.");
                // Log thử raw output xem nó in ra cái gì mà không có JSON
                if (dataStr.trim()) console.log("[Python Raw Output]:", dataStr);
                resolve({}); 
            }
        } catch (e) { 
            console.error("[Python Executor] JSON Parse Error:", e);
            resolve({}); 
        }
    });
  });
};

// --- 2. Helper: Chạy AI ngầm ---
const runAiGradingInBackground = async (submissionId, fileUrls, answerKey) => {
  console.log(`[AI Background] 🚀 Kích hoạt chấm điểm cho submission: ${submissionId}`);
  
  executePythonScript(fileUrls, answerKey).then(async (result) => {
      if (result && (result.score !== undefined || result.comment)) {
        console.log(`[AI Background] ✅ AI chấm xong. Score: ${result.score}`);
        
        await Submission.findByIdAndUpdate(submissionId, {
          aiScore: result.score,
          aiFeedback: result.comment,
          aidetail: result.details,
        });
      } else {
        console.log(`[AI Background] ⚠️ AI trả về kết quả rỗng.`);
      }
  }).catch(err => {
      console.error(`[AI Background] ❌ Lỗi Fatal:`, err);
  });
};

// --- 3. Controller: Nộp bài mới ---
const submitAssignment = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { assignmentId, content } = req.body;
    
    const fileUrls = req.files ? req.files.map(f => f.path) : [];
    
    console.log(`[Submit] User ${studentId} nộp bài cho ${assignmentId}. Files: ${fileUrls.length}`);

    const submission = new Submission({
      assignmentId,
      studentId,
      content: content || "",
      fileUrl: fileUrls,
      submittedAt: Date.now()
    });
    await submission.save();

    const assignment = await Assignment.findById(assignmentId);
    
    res.status(201).json({ success: true, data: submission });

    if (fileUrls.length > 0 && assignment?.answerKey) {
        runAiGradingInBackground(submission._id, fileUrls, assignment.answerKey);
    } else {
        console.log("[Submit] Không kích hoạt AI (Thiếu file hoặc thiếu AnswerKey).");
    }

  } catch (error) {
    console.error("[Submit Error]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 4. Controller: Nộp lại / Cập nhật bài ---
const updateSubmission = async (req, res) => {
  try {
    const submissionId = req.params.id;
    
    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (req.body.content !== undefined) {
        submission.content = req.body.content;
    }
    
    let fileUrls = submission.fileUrl;
    if (req.files && req.files.length > 0) {
        fileUrls = req.files.map(f => f.path);
        submission.fileUrl = fileUrls;
    }
    
    submission.grade = undefined;
    submission.feedback = undefined;
    submission.aiScore = undefined; 
    submission.aiFeedback = undefined;
    submission.aidetail = undefined;
    submission.updatedAt = Date.now();
    
    await submission.save();
    
    const assignment = await Assignment.findById(submission.assignmentId);

    console.log(`[Update] Đã cập nhật submission ${submissionId}`);
    
    res.json({ success: true, data: submission });

    if (fileUrls.length > 0 && assignment?.answerKey) {
        runAiGradingInBackground(submission._id, fileUrls, assignment.answerKey);
    }

  } catch (error) {
    console.error("[Update Error]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 5. Controller: Lấy danh sách bài nộp ---
const getSubmissionsByAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const submissions = await Submission.find({ assignmentId })
            .populate('studentId', 'name email')
            .sort({ submittedAt: -1 });
            
        res.json({ success: true, data: submissions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// --- 6. Controller: Lấy bài nộp của mình ---
const getMySubmissions = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const submissions = await Submission.find({ studentId })
            .populate('assignmentId', 'title deadline')
            .sort({ submittedAt: -1 });

        res.json({ success: true, data: submissions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// --- 7. Controller: Chấm điểm thủ công ---
const gradeSubmission = async (req, res) => {
    try {
        const submissionId = req.params.id;
        const { grade, feedback } = req.body;

        const submission = await Submission.findByIdAndUpdate(
            submissionId,
            { grade, feedback },
            { new: true }
        );

        if (!submission) return res.status(404).json({ success: false, message: "Not found" });

        res.json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export { 
    submitAssignment, 
    updateSubmission, 
    runAiGradingInBackground, 
    getSubmissionsByAssignment, 
    getMySubmissions, 
    gradeSubmission 
};