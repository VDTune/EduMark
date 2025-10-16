// backend/controllers/submissionController.js
import Submission from "../models/submissionModel.js";
import Assignment from "../models/assignmentModel.js";
import Classroom from "../models/classroomModel.js";
import User from "../models/userModel.js";

// POST /api/submissions/submit  (student only)
const submitAssignment = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { assignmentId, content, fileUrl: fileUrlFromBody } = req.body;
    const file = req.file;

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

    const fileUrl = file ? `/uploads/${file.filename}` : fileUrlFromBody;
    console.log('File saved:', file ? { filename: file.filename, path: fileUrl } : 'No file');

    const submission = new Submission({
      assignmentId,
      studentId,
      content,
      fileUrl
    });

    await submission.save();
    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    console.error("submitAssignment error:", error.message, error.stack);
    res.status(500).json({ success: false, message: "Server error" });
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


export { submitAssignment, getSubmissionsByAssignment, getMySubmissions, gradeSubmission };
