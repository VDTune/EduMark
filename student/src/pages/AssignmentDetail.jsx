import { useState, useEffect, useRef} from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const AssignmentDetail = () => {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`/api/assignments/${assignmentId}`)
        console.log('Assignment detail:', res.data)
        if (res.data.success) {
          setAssignment(res.data.data)
        } else {
          throw new Error(res.data.message || 'Failed to load assignment')
        }
      } catch (err) {
        console.error('Error fetching assignment:', err)
        // alert('Không thể tải thông tin bài tập: ' + (err.response?.data?.message || err.message))
        // navigate(-1)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignment()
  }, [assignmentId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && files.length === 0) {
      alert('Vui lòng nhập nội dung hoặc chọn file!')
      return
    }

    setSubmitting(true)
    const formData = new FormData()
    formData.append('assignmentId', assignmentId)
    formData.append('content', content || '')
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append("file", file);  // key phải trùng với backend (vd: files)
      });
    }

    try {
      const res = await axios.post('/api/submissions/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (res.data.success) {
        alert('Nộp bài thành công!')
        setContent('')
        setFiles([])
        if (fileInputRef.current) {
            fileInputRef.current.value = '' // Reset text trên input file
        }
        setSubmitted(true)
        // Có thể chuyển hướng hoặc hiển thị thông báo thành công
      } else {
        throw new Error(res.data.message || 'Nộp bài thất bại')
      }
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message)
      alert(err.response?.data?.message || 'Lỗi khi nộp bài: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-10 flexCenter">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-50">Đang tải bài tập...</span>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-10 flexCenter">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Không tìm thấy bài tập</div>
          <button 
            onClick={() => navigate(-1)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date()

  return (
    <div className="min-h-screen bg-gray-10">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-padd-container">
          <div className="flexBetween py-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flexCenter">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="bold-20 text-gray-90">Azota Classroom</span>
            </Link>              
            <div className="text-right"></div>
            <div>
              <h1 className="medium-18 text-gray-90">{assignment?.title}</h1>
              <p className="regular-14 text-gray-50">
                {assignment?.teacherId?.name && `Giáo viên: ${assignment.teacherId.name}`}
                {assignment?.classId?.name && ` • Lớp: ${assignment.classId.name}`}
              </p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-padd-container py-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-50 hover:text-gray-90 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thông tin bài tập */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-90 mb-4">Thông tin bài tập</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-50 mb-1">Mô tả</label>
                  <p className="text-gray-90 bg-gray-10 p-4 rounded-lg min-h-[100px]">
                    {assignment.description || 'Không có mô tả'}
                  </p>
                </div>

                {assignment.deadline && (
                  <div className={`p-4 rounded-lg ${
                    isOverdue ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <svg className={`w-5 h-5 ${isOverdue ? 'text-red-500' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`font-medium ${isOverdue ? 'text-red-700' : 'text-blue-700'}`}>
                        {isOverdue ? 'ĐÃ QUÁ HẠN' : 'Hạn nộp:'}
                      </span>
                      <span className={isOverdue ? 'text-red-600' : 'text-blue-600'}>
                        {new Date(assignment.deadline).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    {isOverdue && (
                      <p className="text-red-600 text-sm mt-1">
                        Bài tập đã quá hạn nộp
                      </p>
                    )}
                  </div>
                )}

                {assignment.attachments && assignment.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-50 mb-2">Tệp đính kèm</label>
                    <div className="space-y-2">
                      {assignment.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="text-sm">Tệp {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form nộp bài */}
          {assignment.isSubmitRequired && (
            <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-90 mb-4">Nộp bài tập</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-50 mb-2">
                    Nội dung bài nộp
                  </label>
                  <textarea 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    placeholder="Nhập nội dung bài làm của bạn..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors h-32 resize-vertical"
                    disabled={submitting || submitted}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-50 mb-2">
                    Hoặc tải lên file (Ảnh hoặc PDF)
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    multiple
                    onChange={(e) => setFiles([...e.target.files])}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={submitting || submitted || (isOverdue && !assignment.allowLate)}
                  />

                  {files && files.length > 0 && (
                    <ul className="text-sm text-green-600 mt-2 space-y-1">
                      {files.map((file, index) => (
                        <li key={index}>📄 {file.name}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={submitted || submitting || (isOverdue && !assignment.allowLate)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    submitted
                      ? 'bg-green-500 text-white cursor-default'
                      : submitting || (isOverdue && !assignment.allowLate)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
                >
                  {submitted ? (
                    'Đã nộp'
                  ) : submitting ? (
                    <span className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      Đang nộp...
                    </span>
                  ) : isOverdue && assignment.allowLate ? (
                    'Nộp muộn'
                  ) : isOverdue && !assignment.allowLate ? (
                    'Đã hết hạn'
                  ) : (
                    'Nộp bài'
                  )}
                </button>

                {isOverdue && (
                  <p className={`text-sm text-center ${assignment.allowLate ? 'text-orange-600' : 'text-red-600'}`}>
                    {assignment.allowLate 
                      ? 'Bài tập đã quá hạn. Bạn vẫn có thể nộp bài muộn.' 
                      : 'Bài tập đã quá hạn và không cho phép nộp muộn.'}
                  </p>
                )}
              </div>
            </form>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssignmentDetail