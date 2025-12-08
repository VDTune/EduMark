const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // Middleware để xử lý file upload
const ocrController = require('../controllers/ocrController');

// Định nghĩa route cho việc xử lý OCR
// POST /api/ocr/grade
router.post('/grade', upload.single('submission'), ocrController.gradeSubmission);

module.exports = router;
