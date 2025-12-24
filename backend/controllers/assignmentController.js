// backend/controllers/assignmentController.js
import Assignment from "../models/assignmentModel.js";
import Classroom from "../models/classroomModel.js";

// POST /api/assignments
const createAssignment = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    // THÊM subject VÀO DESTRUCTURING
    const { title, description, classId, deadline, answerKey, subject } = req.body;

    if (!title || !classId) return res.status(400).json({ success: false, message: "Missing fields" });

    const classroom = await Classroom.findById(classId);
    if (!classroom) return res.status(404).json({ success: false, message: "Class not found" });
    if (classroom.teacher.toString() !== teacherId) return res.status(403).json({ success: false, message: "Not your class" });

    const attachments = req.body.attachments || [];

    // TẠO ASSIGNMENT VỚI SUBJECT
    const assignment = new Assignment({ 
      title, 
      description, 
      classId, 
      teacherId, 
      deadline, 
      answerKey, 
      attachments,
      subject: subject || 'Khác', // Mặc định là Khác nếu không chọn
      isSubmitRequired: req.body.isSubmitRequired !== undefined ? req.body.isSubmitRequired : true,
      allowLate: req.body.allowLate !== undefined ? req.body.allowLate : false,
      resubmitAllowed: req.body.resubmitAllowed !== undefined ? req.body.resubmitAllowed : true
    });

    await assignment.save();
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    console.error("createAssignment error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ... (Giữ nguyên phần còn lại: getAssignmentsByClass, getAssignmentById)
const getAssignmentsByClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    const userId = req.user.userId;
    const role = req.user.role;

    const classroom = await Classroom.findById(classId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (role === "teacher" && classroom.teacher.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (role === "student" && !classroom.students.includes(userId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const assignments = await Assignment.find({ classId })
      .populate("teacherId", "name")
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error("getAssignmentsByClass error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const asg = await Assignment.findById(req.params.id)
      .populate("teacherId", "name")
      .populate("classId", "name");
    
    if (!asg) return res.status(404).json({ success: false, message: "Assignment not found" });
    res.json({ success: true, data: asg });
  } catch (error) {
    console.error("getAssignmentById error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export { createAssignment, getAssignmentsByClass, getAssignmentById };