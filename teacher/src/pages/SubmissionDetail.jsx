import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

const SubmissionDetail = () => {
  const { assignmentId, studentId } = useParams()
  const [submission, setSubmission] = useState(null)
  const [assignmentInfo, setAssignmentInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gradeInput, setGradeInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewImg, setPreviewImg] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Đảm bảo images luôn là một mảng, ngay cả khi fileUrl không tồn tại hoặc không phải là mảng
  const images = Array.isArray(submission?.fileUrl) ? submission.fileUrl : []
  useEffect(() => {
    if (images.length > 0) {
      setCurrentImageIndex(0)
    }
  }, [images])
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const asgRes = await axios.get(`/api/assignments/${assignmentId}`)
        setAssignmentInfo(asgRes.data.data)

        const subRes = await axios.get(`/api/submissions/assignment/${assignmentId}`)
        const list = subRes.data.data || []

        const found = list.find(s => s.studentId?._id === studentId)
        setSubmission(found || null)

      } catch (err) {
        console.error(err)
        alert("Không thể tải bài nộp")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [assignmentId, studentId])

  const handleSaveGrade = async () => {
    if (!gradeInput) return alert("Vui lòng nhập điểm")

    try {
      setSaving(true)
      await axios.post(`/api/submissions/${submission._id}/grade`, {
        grade: gradeInput,
        feedback: feedbackInput
      })
      alert("Đã lưu điểm giáo viên!")
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi lưu điểm")
    } finally {
      setSaving(false)
    }
  }
  const getImageUrl = (path) => {
    if (!path) return ""
    if (path.startsWith("http")) return path
    return `http://localhost:5000/${path.replace(/^\/+/, "")}`
  }

  const goToPrevious = () => {
    const isFirstImage = currentImageIndex === 0
    const newIndex = isFirstImage ? images.length - 1 : currentImageIndex - 1
    setCurrentImageIndex(newIndex)
  }

  const goToNext = () => {
    const isLastImage = currentImageIndex === images.length - 1
    const newIndex = isLastImage ? 0 : currentImageIndex + 1
    setCurrentImageIndex(newIndex)
  }

  const goToImage = (index) => setCurrentImageIndex(index)

  if (loading || !submission) {
    return (
      <div className="min-h-screen flexCenter text-gray-600">
        Đang tải bài nộp...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-10">

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 w-full z-50">
        <div className="max-padd-container">
          <div className="flexBetween py-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flexCenter">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="bold-20 text-gray-90">Azota Classroom</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-padd-container py-8 pt-20">

        <Link
          to={`/assignment/${assignmentId}/submissions`}
          className="text-gray-50 hover:text-gray-90 mb-6 inline-flex items-center"
        >
          ← Quay lại
        </Link>

        <h2 className="h2 text-gray-90 mb-4">
          Chi tiết bài nộp: {submission.studentId?.name}
        </h2>

        {/* ---- LAYOUT TRÁI - PHẢI ---- */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

          {/* LEFT (GALLERY 3 CỘT) */}
          <div className="md:col-span-3 bg-white p-5 rounded-xl border">
            <h2 className="font-semibold mb-3 text-gray-900">Ảnh bài làm</h2>

            {images.length  === 0 ? (
              <p className="text-gray-500">Không có ảnh bài nộp</p>
            ) : (
              <div>
                {/* Main Image Display with Navigation */}
                <div className="relative mb-4">
                  {images[currentImageIndex] && (
                      <img
                        src={getImageUrl(images[currentImageIndex])}
                        alt={`submission-${currentImageIndex + 1}`}
                        className="h-screen w-auto object-contain mx-auto rounded-lg border"
                        onClick={() => setPreviewImg(getImageUrl(images[currentImageIndex]))}
                      />
                    )}
                  {images.length > 1 && (
                    <>
                      <button onClick={goToPrevious} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button onClick={goToNext} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex justify-center gap-2 flex-wrap">
                    {images.map((img, index) => (
                      <img
                        key={index}
                        src={getImageUrl(img)}
                        alt={`thumbnail-${index + 1}`}
                        onClick={() => goToImage(index)}
                        className={`w-16 h-16 object-cover rounded-md border-2 cursor-pointer transition-all ${
                          currentImageIndex === index
                            ? 'border-blue-500 scale-105'
                            : 'border-transparent hover:border-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="mt-4 text-gray-700">
              <span className="font-medium">Nội dung text:</span> {submission.content}
            </p>
          </div>

          {/* RIGHT (2 CỘT) */}
          <div className="md:col-span-2 space-y-6">

            {/* AI SCORE */}
            <div className="bg-white p-5 rounded-xl border">
              <h3 className="font-semibold text-gray-900 mb-2">Kết quả AI</h3>
              <p className="text-gray-700">
                <span className="font-medium">Điểm AI:</span> {submission.aiScore ?? "Chưa có"}
              </p>
              <p className="mt-2 text-gray-700">
                <span className="font-medium">Nhận xét AI:</span><br />
                {submission.aiFeedback || "Chưa có nhận xét"}
              </p>
            </div>

            {/* TEACHER GRADE */}
            <div className="bg-white p-5 rounded-xl border">
              <h3 className="font-semibold text-gray-900 mb-4">Giáo viên chấm</h3>

              <label className="block font-medium text-gray-700 mb-1">Điểm</label>
              <input
                type="number"
                value={gradeInput}
                onChange={(e) => setGradeInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mb-3"
                placeholder="0-10"
              />

              <label className="block font-medium text-gray-700 mb-1">Nhận xét</label>
              <textarea
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Nhận xét..."
                rows={3}
              ></textarea>

              <button
                onClick={handleSaveGrade}
                disabled={saving}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {saving ? "Đang lưu..." : "Lưu điểm"}
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* LIGHTBOX PHÓNG TO ẢNH */}
      {previewImg && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <img
            src={getImageUrl(previewImg)}
            className="max-w-full max-h-full rounded-lg"
            alt="preview"
          />
          <button
            onClick={() => setPreviewImg(null)}
            className="absolute top-5 right-5 bg-white px-4 py-2 rounded shadow"
          >
            Đóng
          </button>
        </div>
      )}

    </div>
  )
}

export default SubmissionDetail
