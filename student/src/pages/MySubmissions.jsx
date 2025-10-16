import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const MySubmissions = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Fetching my submissions...')
        const res = await axios.get('/api/submissions/mine')
        console.log('Submissions response:', res.data)
        
        if (res.data.success) {
          setSubmissions(res.data.data || [])
        } else {
          throw new Error(res.data.message || 'Failed to load submissions')
        }
      } catch (err) {
        console.error('Error fetching submissions:', err)
        setError(err.response?.data?.message || err.message || 'Không thể tải danh sách bài nộp')
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [])

  const getGradeColor = (grade) => {
    if (grade === undefined || grade === null) return 'text-gray-50'
    if (grade >= 8) return 'text-green-600'
    if (grade >= 6.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBadge = (grade) => {
    if (grade === undefined || grade === null) return 'Chưa chấm'
    if (grade >= 8) return 'Giỏi'
    if (grade >= 6.5) return 'Khá'
    if (grade >= 5) return 'Trung bình'
    return 'Yếu'
  }

  const getStatusBadge = (sub) => {
    if (sub.grade !== undefined && sub.grade !== null) {
      return <span className="azota-badge-success">Đã chấm</span>
    }
    return <span className="azota-badge-info">Đã nộp</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-10 flexCenter">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-50">Đang tải bài nộp...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-10 flexCenter">
        <div className="text-center bg-white p-8 rounded-xl shadow-md">
          <div className="text-red-500 text-xl mb-4">❌ {error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-10">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-padd-container">
          <div className="flexBetween py-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-gray-50 hover:text-gray-90 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại
              </Link>
              <div className="w-px h-6 bg-gray-200"></div>
              <h1 className="medium-18 text-gray-90">Bài nộp của tôi</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-padd-container py-8">
        <div className="mb-8">
          <h1 className="h1 text-gray-90 mb-2">Bài nộp của tôi</h1>
          <p className="regular-16 text-gray-50">
            Tổng số bài đã nộp: {submissions.length}
            {submissions.filter(sub => sub.grade !== undefined && sub.grade !== null).length > 0 && 
              ` • Đã chấm: ${submissions.filter(sub => sub.grade !== undefined && sub.grade !== null).length}`
            }
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="flexCenter flex-col py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-20 h-20 bg-gray-10 rounded-full flexCenter mb-4">
              <svg className="w-8 h-8 text-gray-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="medium-20 text-gray-90 mb-2">Chưa có bài nộp nào</h3>
            <p className="regular-15 text-gray-50 text-center">
              Hãy vào lớp học và nộp bài tập để xem bài nộp tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map(sub => (
              <div key={sub._id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="p-6">
                  <div className="flexBetween mb-4">
                    <div className="flex-1">
                      <h2 className="medium-18 text-gray-90 mb-2">
                        Bài tập: {sub.assignmentId?.title || 'Không có tiêu đề'}
                      </h2>
                      <div className="flex items-center gap-4 flex-wrap">
                        {getStatusBadge(sub)}
                        <span className="text-sm text-gray-50">
                          Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Hiển thị điểm số nổi bật */}
                    {sub.grade !== undefined && sub.grade !== null && (
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getGradeColor(sub.grade)}`}>
                          {sub.grade.toFixed(1)}
                        </div>
                        <div className={`text-sm font-medium ${getGradeColor(sub.grade)}`}>
                          {getGradeBadge(sub.grade)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nội dung bài nộp */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-50 mb-2">Nội dung bài nộp:</h3>
                    <div className="bg-gray-10 p-4 rounded-lg">
                      {sub.content ? (
                        <p className="text-gray-90 whitespace-pre-wrap">{sub.content}</p>
                      ) : (
                        <p className="text-gray-30 italic">Không có nội dung văn bản</p>
                      )}
                    </div>
                  </div>

                  {/* File đính kèm */}
                  {sub.fileUrl && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-50 mb-2">File đính kèm:</h3>
                      <a 
                        href={`http://localhost:5000${sub.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Tải file bài nộp
                      </a>
                    </div>
                  )}

                  {/* Phần chấm điểm và phản hồi của giáo viên */}
                  {sub.grade !== undefined && sub.grade !== null ? (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h3 className="text-sm font-medium text-gray-50 mb-3">Kết quả chấm điểm:</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Điểm số */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-green-800">Điểm số</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${getGradeColor(sub.grade)}`}>
                              {sub.grade.toFixed(1)}
                            </span>
                            <span className={`text-sm font-medium ${getGradeColor(sub.grade)}`}>
                              {getGradeBadge(sub.grade)}
                            </span>
                          </div>
                        </div>

                        {/* Phản hồi */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <span className="font-medium text-blue-800">Phản hồi từ giáo viên</span>
                          </div>
                          <p className="text-blue-900 whitespace-pre-wrap">
                            {sub.feedback || 'Không có phản hồi'}
                          </p>
                        </div>
                      </div>

                      {/* Thông tin thời gian chấm */}
                      {sub.gradedAt && (
                        <div className="mt-3 text-sm text-gray-50">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Chấm lúc: {new Date(sub.gradedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex items-center gap-2 text-orange-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Bài tập chưa được chấm điểm</span>
                      </div>
                      <p className="text-gray-50 text-sm mt-1">
                        Giáo viên sẽ chấm điểm và phản hồi trong thời gian sớm nhất.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MySubmissions