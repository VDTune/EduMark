// backend/routes/assignmentRoute.js
import express from "express";
import { createAssignment, getAssignmentsByClass, getAssignmentById } from "../controllers/assignmentController.js";
import authMiddleware from "../middleware/auth.js";
import authorizeRoles from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("teacher"), createAssignment);
router.get("/class/:classId", authMiddleware, getAssignmentsByClass);
router.get("/:id", authMiddleware, getAssignmentById);

export default router;
