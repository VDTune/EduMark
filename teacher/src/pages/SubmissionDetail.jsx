import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom' // Added useNavigate
import axios from 'axios'

const SubmissionDetail = () => {
  const { assignmentId, studentId } = useParams()
  const navigate = useNavigate() // Initialize hook
  const [submission, setSubmission] = useState(null)
  const [assignmentInfo, setAssignmentInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gradeInput, setGradeInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewImg, setPreviewImg] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Ensure images is always an array
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
        
        // Pre-fill grade if it exists
        if (found) {
            if (found.grade !== null && found.grade !== undefined) setGradeInput(found.grade);
            if (found.feedback) setFeedbackInput(found.feedback);
        }

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
    if (!gradeInput && gradeInput !== 0) return alert("Vui lòng nhập điểm") // Allow 0

    try {
      setSaving(true)
      await axios.post(`/api/submissions/${submission._id}/grade`, {
        grade: gradeInput,
        feedback: feedbackInput
      })
      // Updated Success Message
      alert("Đã chấm điểm bài làm thành công!")
      
      // Navigate back to the list
      navigate(`/assignment/${assignmentId}/submissions`)
      
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
      <div className="min-h-screen flexCenter text-gray-50 bg-gray-10">
        <div className="loading-spinner mr-3"></div>
        Đang tải bài nộp...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-10 pb-12">

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

      <div className="max-padd-container py-8 pt-24">

        <Link
          to={`/assignment/${assignmentId}/submissions`}
          className="text-gray-50 hover:text-blue-600 mb-6 inline-flex items-center transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Quay lại danh sách
        </Link>

        <div className="flexBetween items-end mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-90 mb-1">
                Chi tiết bài nộp
                </h2>
                <p className="text-gray-50">Học sinh: <span className="font-semibold text-gray-90">{submission.studentId?.name}</span></p>
            </div>
            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-full text-sm font-bold border ${
                submission.grade !== undefined && submission.grade !== null 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
                {submission.grade !== undefined && submission.grade !== null ? 'Đã chấm điểm' : 'Chưa chấm điểm'}
            </div>
        </div>

        {/* ---- LAYOUT TRÁI - PHẢI ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* LEFT (GALLERY 3 CỘT) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-gray-90 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Ảnh bài làm
            </h3>

            {images.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-50">Học sinh không nộp ảnh.</p>
              </div>
            ) : (
              <div>
                {/* Main Image Display with Navigation */}
                <div className="relative mb-4 bg-gray-900 rounded-lg overflow-hidden group">
                  {images[currentImageIndex] && (
                      <img
                        src={getImageUrl(images[currentImageIndex])}
                        alt={`submission-${currentImageIndex + 1}`}
                        className="h-[60vh] w-full object-contain mx-auto cursor-zoom-in"
                        onClick={() => setPreviewImg(getImageUrl(images[currentImageIndex]))}
                      />
                    )}
                  {images.length > 1 && (
                    <>
                      <button onClick={goToPrevious} className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full hover:bg-white/40 transition-colors backdrop-blur-sm border border-white/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button onClick={goToNext} className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full hover:bg-white/40 transition-colors backdrop-blur-sm border border-white/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          currentImageIndex === index
                            ? 'border-blue-600 ring-2 ring-blue-100'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                            src={getImageUrl(img)}
                            alt={`thumb-${index}`}
                            className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-2 uppercase">Nội dung văn bản:</h4>
                <p className="text-gray-90 whitespace-pre-wrap text-sm">
                    {submission.content || "Không có nội dung văn bản."}
                </p>
            </div>
          </div>

          {/* RIGHT (2 CỘT) */}
          <div className="lg:col-span-2 space-y-6">

            {/* AI SCORE CARD */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flexCenter text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-gray-90">Kết quả AI Chấm</h3>
                      <p className="text-xs text-gray-50">Gợi ý từ hệ thống</p>
                  </div>
              </div>
              
              <div className="flex justify-between items-center mb-4 bg-purple-50 p-4 rounded-lg border border-purple-100">
                <span className="font-medium text-gray-700">Điểm đề xuất:</span>
                <span className="text-3xl font-bold text-purple-700">{submission.aiScore ?? "--"}</span>
              </div>
              
              <div className="space-y-2">
                <span className="text-sm font-bold text-gray-700 uppercase">Nhận xét chi tiết:</span>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 max-h-48 overflow-y-auto">
                    {submission.aiFeedback ? submission.aiFeedback : <em className="text-gray-400">Chưa có dữ liệu nhận xét từ AI...</em>}
                </div>
              </div>
            </div>

            {/* TEACHER GRADE CARD */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flexCenter text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-gray-90">Giáo viên chấm điểm</h3>
                      <p className="text-xs text-gray-50">Quyết định điểm số cuối cùng</p>
                  </div>
              </div>

              <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Điểm số (0-10)</label>
                    <input
                        type="number"
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-300"
                        placeholder="Nhập điểm..."
                        min="0" max="10" step="0.1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lời phê / Nhận xét</label>
                    <textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-32 resize-none"
                        placeholder="Nhập nhận xét cho học sinh..."
                    ></textarea>
                </div>

                <button
                    onClick={handleSaveGrade}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Lưu kết quả
                        </>
                    )}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* LIGHTBOX PHÓNG TO ẢNH */}
      {previewImg && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="relative w-full h-full flexCenter p-4">
            <img
                src={getImageUrl(previewImg)}
                className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                alt="preview"
            />
            <button
                onClick={() => setPreviewImg(null)}
                className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default SubmissionDetail