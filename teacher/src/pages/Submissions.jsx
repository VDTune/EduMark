import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

const Submissions = () => {
  const { assignmentId } = useParams()
  const [submissions, setSubmissions] = useState([])
  const [assignmentInfo, setAssignmentInfo] = useState(null)
  const [grades, setGrades] = useState({})
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Lấy thông tin bài tập
        const assignmentRes = await axios.get(`/api/assignments/${assignmentId}`)
        setAssignmentInfo(assignmentRes.data.data)
        
        // Lấy bài nộp
        const submissionsRes = await axios.get(`/api/submissions/assignment/${assignmentId}`)
        setSubmissions(submissionsRes.data.data || [])
        
      } catch (err) {
        console.error('Error fetching data:', err)
        alert('Không thể tải thông tin bài nộp')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [assignmentId])

  const handleGradeChange = (subId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [subId]: { ...prev[subId], [field]: value }
    }))
  }

  const handleGradeSubmit = async (subId) => {
    const { grade, feedback } = grades[subId] || {}
    if (!grade) return alert('Vui lòng nhập điểm')
    
    try {
      setGrading(prev => ({ ...prev, [subId]: true }))
      await axios.post(`/api/submissions/${subId}/grade`, { grade, feedback })
      alert('Chấm điểm thành công!')
      
      // Refresh submissions
      const submissionsRes = await axios.get(`/api/submissions/assignment/${assignmentId}`)
      setSubmissions(submissionsRes.data.data || [])
      
      // Clear grade input
      setGrades(prev => {
        const newGrades = { ...prev }
        delete newGrades[subId]
        return newGrades
      })
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi chấm điểm')
    } finally {
      setGrading(prev => ({ ...prev, [subId]: false }))
    }
  }

  const getGradeColor = (grade) => {
    if (grade >= 8) return 'text-green-600'
    if (grade >= 6.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-10 flexCenter">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-50">Đang tải...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-10">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
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

      <div className="max-padd-container py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={`/class/${assignmentInfo?.classId}`} className="flex items-center text-gray-50 hover:text-gray-90 mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại lớp học
          </Link>
          <div className="flexBetween">
            <div>
              <h1 className="h1 text-gray-90 mb-2">Bài nộp: {assignmentInfo?.title}</h1>
              <p className="regular-16 text-gray-50">
                {submissions.length} bài nộp • Hạn nộp: {assignmentInfo?.deadline ? new Date(assignmentInfo.deadline).toLocaleDateString('vi-VN') : 'Không có'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-90 mb-2">Chưa có bài nộp nào</h3>
              <p className="text-gray-50">Học sinh chưa nộp bài cho bài tập này</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {submissions.map(sub => (
                <div key={sub._id} className="p-6">
                  <div className="flexBetween mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flexCenter text-white font-medium">
                        {sub.studentId?.name?.charAt(0)?.toUpperCase() || 'H'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-90">{sub.studentId?.name}</h3>
                        <p className="text-sm text-gray-50">{sub.studentId?.email}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {sub.grade !== undefined && sub.grade !== null ? (
                        <div className={`text-lg font-bold ${getGradeColor(sub.grade)}`}>
                          {sub.grade} điểm
                        </div>
                      ) : (
                        <span className="text-orange-600 font-medium">Chưa chấm</span>
                      )}
                      <p className="text-sm text-gray-50">
                        {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-90 mb-2">
                      <span className="font-medium">Nội dung:</span> {sub.content || 'Không có nội dung'}
                    </p>
                    {sub.fileUrl && (
                      <a 
                        href={`http://localhost:5000${sub.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Tải file bài nộp
                      </a>
                    )}
                  </div>

                  {sub.feedback && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Phản hồi:</span> {sub.feedback}
                      </p>
                    </div>
                  )}

                  {/* Chấm điểm */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-90 mb-3">Chấm điểm</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Điểm số
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          placeholder="0-10"
                          value={grades[sub._id]?.grade || ''}
                          onChange={(e) => handleGradeChange(sub._id, 'grade', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phản hồi
                        </label>
                        <input
                          type="text"
                          placeholder="Nhận xét..."
                          value={grades[sub._id]?.feedback || ''}
                          onChange={(e) => handleGradeChange(sub._id, 'feedback', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleGradeSubmit(sub._id)}
                      disabled={grading[sub._id] || !grades[sub._id]?.grade}
                      className="mt-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {grading[sub._id] ? 'Đang chấm...' : 'Lưu điểm'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Submissions