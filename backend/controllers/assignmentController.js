// backend/controllers/assignmentController.js
import Assignment from "../models/assignmentModel.js";
import Classroom from "../models/classroomModel.js";

// POST /api/assignments  (teacher only)
const createAssignment = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { title, description, classId, deadline, answerKey } = req.body;
    if (!title || !classId) return res.status(400).json({ success: false, message: "Missing fields" });

    const classroom = await Classroom.findById(classId);
    if (!classroom) return res.status(404).json({ success: false, message: "Class not found" });
    if (classroom.teacher.toString() !== teacherId) return res.status(403).json({ success: false, message: "Not your class" });

    const attachments = req.body.attachments || [];

    const assignment = new Assignment({ title, description, classId, teacherId, deadline, answerKey, attachments });
    await assignment.save();
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    console.error("createAssignment error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/assignments/class/:classId  (teacher or student of class)
const getAssignmentsByClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    const userId = req.user.userId;
    const role = req.user.role;

    // Kiểm tra quyền truy cập lớp học
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
      .populate("teacherId", "name") // POPULATE THÔNG TIN GIÁO VIÊN
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error("getAssignmentsByClass error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/assignments/:id
const getAssignmentById = async (req, res) => {
  try {
    const asg = await Assignment.findById(req.params.id)
      .populate("teacherId", "name") // POPULATE THÔNG TIN GIÁO VIÊN
      .populate("classId", "name");
    
    if (!asg) return res.status(404).json({ success: false, message: "Assignment not found" });
    res.json({ success: true, data: asg });
  } catch (error) {
    console.error("getAssignmentById error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export { createAssignment, getAssignmentsByClass, getAssignmentById };