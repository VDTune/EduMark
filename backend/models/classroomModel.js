import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

const Classroom = mongoose.models.Classroom || mongoose.model("Classroom", classroomSchema);
export default Classroom;
