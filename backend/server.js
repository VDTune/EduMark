import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoute.js';
import classroomRoutes from './routes/classroomRoute.js';
import assignmentRoutes from './routes/assignmentRoute.js';
import submissionRoutes from './routes/submissionRoute.js';
import fs from 'fs';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware log request
app.use((req, res, next) => {
  // Danh sách các từ khóa trong URL muốn bỏ qua không log
  const ignorePaths = ['/api/submissions', '/api/assignments', '/api/classrooms'];
  // Kiểm tra xem URL hiện tại có chứa từ khóa nào trong danh sách trên không
  const isIgnored = ignorePaths.some(path => req.url.includes(path));
  // Nếu KHÔNG nằm trong danh sách bỏ qua thì mới in log
  if (!isIgnored) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Serve uploads folder static
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadDir}`);
}
app.use("/uploads", express.static(uploadDir, {
  setHeaders: (res) => {
    // console.log('Serving file from:', uploadDir);
    res.set('Content-Disposition', 'inline');
  }
}));

// routes
app.use("/api/users", userRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);

// basic health
app.get("/", (req, res) => res.send("EduMark Backend is running"));

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ success: false, message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} at ${new Date().toISOString()}`));