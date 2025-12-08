import multer from "multer";
import fs from "fs";
import path from "path";

const tempDir = path.join(process.cwd(), "./uploads", "temp_zips");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

export const uploadZip = multer({ storage });
