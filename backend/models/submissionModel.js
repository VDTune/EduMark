// backend/models/submissionModel.js
import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String }, // text
  fileUrl: { type: String },  // file path
  submittedAt: { type: Date, default: Date.now },

  // grading
  grade: { type: Number },
  feedback: { type: String },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  gradedAt: { type: Date },

  // ai fields (sau này)
  aiScore: { type: Number },
  aiFeedback: { type: String }
}, { timestamps: true });

const Submission = mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
export default Submission;
