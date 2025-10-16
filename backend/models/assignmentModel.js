// backend/models/assignmentModel.js
import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deadline: { type: Date },
  answerKey: { type: String },
  attachments: [{ type: String }] 
}, { timestamps: true });

const Assignment = mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
export default Assignment;
