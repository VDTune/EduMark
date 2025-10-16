// backend/controllers/classroomController.js
import Classroom from "../models/classroomModel.js";
import User from "../models/userModel.js";

// POST /api/classrooms  (teacher only)
const createClassroom = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Missing class name" });

    const classroom = new Classroom({ name, teacher: teacherId });
    await classroom.save();

    // optionally add class to teacher.classes
    await User.findByIdAndUpdate(teacherId, { $push: { classes: classroom._id } });

    res.status(201).json({ success: true, data: classroom });
  } catch (error) {
    console.error("createClassroom error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/classrooms/:id/add-student  (teacher only)
const addStudentToClass = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const classId = req.params.id;
    const { studentEmail } = req.body;
    if (!studentEmail) return res.status(400).json({ success: false, message: "Missing studentEmail" });

    const classroom = await Classroom.findById(classId);
    if (!classroom) return res.status(404).json({ success: false, message: "Class not found" });
    if (classroom.teacher.toString() !== teacherId) return res.status(403).json({ success: false, message: "Not your class" });

    const student = await User.findOne({ email: studentEmail });
    if (!student) return res.status(404).json({ success: false, message: "Student not found, ask them to register" });
    if (student.role !== "student") return res.status(400).json({ success: false, message: "User is not a student" });

    // avoid duplicates
    if (classroom.students.includes(student._id)) return res.json({ success: true, message: "Student already in class" });

    classroom.students.push(student._id);
    await classroom.save();

    // add class to student's classes
    student.classes.push(classroom._id);
    await student.save();

    res.json({ success: true, data: classroom });
  } catch (error) {
    console.error("addStudentToClass error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/classrooms  (teacher: classes he created, student: classes he joined)
const getMyClassrooms = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    let classes;
    if (role === "teacher") {
      classes = await Classroom.find({ teacher: userId }).populate("students", "name email");
    } else {
      classes = await Classroom.find({ students: userId }).populate("teacher", "name email");
    }
    res.json({ success: true, data: classes });
  } catch (error) {
    console.error("getMyClassrooms error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// GET /api/classrooms/:id - Lấy thông tin chi tiết lớp học
const getClassroomById = async (req, res) => {
  try {
    const classroomId = req.params.id;
    const userId = req.user.userId;
    const role = req.user.role;

    const classroom = await Classroom.findById(classroomId)
      .populate("teacher", "name email")
      .populate("students", "name email");

    if (!classroom) {
      return res.status(404).json({ success: false, message: "Classroom not found" });
    }

    // Kiểm tra quyền truy cập
    if (role === "teacher" && classroom.teacher._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (role === "student" && !classroom.students.some(student => student._id.toString() === userId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, data: classroom });
  } catch (error) {
    console.error("getClassroomById error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export { createClassroom, addStudentToClass, getMyClassrooms, getClassroomById };
