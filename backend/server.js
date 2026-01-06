import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import cookieParser from 'cookie-parser'   // ✅ BẮT BUỘC

import { connectDB } from './config/db.js'
import userRoutes from './routes/userRoute.js'
import classroomRoutes from './routes/classroomRoute.js'
import assignmentRoutes from './routes/assignmentRoute.js'
import submissionRoutes from './routes/submissionRoute.js'

connectDB()

const app = express()

/* =======================
   ✅ CORS – FIX MẤT COOKIE
======================= */
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    process.env.CLIENT_TEACHER_URL
  ],
  credentials: true
}))

// Cho phép preflight
app.options('*', cors())

/* =======================
   ✅ BODY + COOKIE
======================= */
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())   // ✅ BẮT BUỘC để đọc cookie token

/* =======================
   LOG REQUEST (GIỮ NGUYÊN LOGIC CỦA BẠN)
======================= */
app.use((req, res, next) => {
  const ignorePaths = ['/api/submissions', '/api/assignments', '/api/classrooms']
  const isIgnored = ignorePaths.some(p => req.url.includes(p))
  if (!isIgnored) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  }
  next()
})

/* =======================
   STATIC UPLOADS
======================= */
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
  console.log(`Created uploads directory: ${uploadDir}`)
}

app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res) => {
    res.set('Content-Disposition', 'inline')
  }
}))

/* =======================
   ROUTES
======================= */
app.use('/api/users', userRoutes)
app.use('/api/classrooms', classroomRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/submissions', submissionRoutes)

/* =======================
   HEALTH CHECK (CHO RENDER)
======================= */
app.get('/healthz', (req, res) => {
  res.status(200).send('OK')
})

app.get('/', (req, res) => {
  res.send('EduMark Backend is running')
})

/* =======================
   ERROR HANDLER
======================= */
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: 'Internal server error' })
})

/* =======================
   404 HANDLER
======================= */
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`)
  res.status(404).json({ success: false, message: 'Route not found' })
})

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} at ${new Date().toISOString()}`)
})
