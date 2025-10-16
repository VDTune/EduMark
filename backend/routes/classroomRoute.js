// backend/routes/classroomRoute.js
import express from "express";
import { createClassroom, addStudentToClass, getMyClassrooms, getClassroomById } from "../controllers/classroomController.js";
import authMiddleware from "../middleware/auth.js";
import authorizeRoles from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("teacher"), createClassroom);
router.post("/:id/add-student", authMiddleware, authorizeRoles("teacher"), addStudentToClass);
router.get("/my", authMiddleware, getMyClassrooms);
router.get("/:id", authMiddleware, getClassroomById); // THÊM ENDPOINT MỚI

export default router;