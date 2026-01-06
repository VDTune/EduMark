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

  // --- GIỮ NGUYÊN CÁC HÀM HELPER LOGIC CŨ ---
  const getGradeColor = (grade) => {
    if (grade === undefined || grade === null) return 'text-gray-400'
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
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Đã chấm
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Đã nộp
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-10 pt-20 flex justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-10 pt-20 flex justify-center px-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-lg w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="text-red-600 text-lg font-bold mb-2">Đã xảy ra lỗi</div>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-10 pt-5 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-4 transition-colors font-medium text-sm group">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-2 group-hover:border-blue-300 group-hover:bg-blue-50 transition-all">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </div>
                Quay lại trang chủ
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Bài nộp của tôi</h1>
                    <p className="text-gray-500">
                        Tổng số bài đã nộp: <span className="font-bold text-gray-900">{submissions.length}</span>
                        {submissions.filter(sub => sub.grade !== undefined && sub.grade !== null).length > 0 && 
                        ` • Đã chấm: ${submissions.filter(sub => sub.grade !== undefined && sub.grade !== null).length}`
                        }
                    </p>
                </div>
            </div>
        </div>

        {/* CONTENT */}
        {submissions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có bài nộp nào</h3>
            <p className="text-gray-500 mb-6">Hãy vào lớp học và nộp bài tập để xem lịch sử tại đây.</p>
            <Link to="/" className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                Đến danh sách lớp học
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {submissions.map(sub => (
              <div key={sub._id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group flex flex-col h-full">
                
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-4">
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1" title={sub.assignmentId?.title}>
                      {sub.assignmentId?.title || 'Bài tập không xác định'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  {getStatusBadge(sub)}
                </div>

                {/* Card Content (Preview nội dung) */}
                <div className="mb-4 flex-grow">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[80px]">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Nội dung bài làm</span>
                    {sub.content ? (
                      <p className="text-sm text-gray-700 line-clamp-3">{sub.content}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        Nội dung nằm trong file đính kèm
                      </p>
                    )}
                  </div>
                </div>

                {/* File Attachment Link */}
                {sub.fileUrl && sub.fileUrl.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                         {Array.isArray(sub.fileUrl) ? sub.fileUrl.map((file, idx) => (
                             <a key={idx} href={`http://localhost:5000/${file}`} target="_blank" rel="noopener noreferrer" 
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-100 max-w-full">
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                <span className="truncate max-w-[150px]">{file.split('/').pop()}</span>
                             </a>
                         )) : (
                             <a href={`http://localhost:5000${sub.fileUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-100">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                File đính kèm
                             </a>
                         )}
                    </div>
                  </div>
                )}

                {/* SECTION QUAN TRỌNG: KẾT QUẢ CHẤM ĐIỂM (Giữ nguyên logic if/else) */}
                {sub.grade !== undefined && sub.grade !== null ? (
                  <div className="border-t border-gray-100 pt-4 mt-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Box Điểm số */}
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Điểm số</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className={`text-2xl font-bold ${getGradeColor(sub.grade)}`}>
                              {sub.grade.toFixed(1)}
                            </span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                sub.grade >= 8 ? 'bg-green-200 text-green-800' : sub.grade >= 5 ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
                            }`}>
                              {getGradeBadge(sub.grade)}
                            </span>
                        </div>
                      </div>

                      {/* Box Phản hồi */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col justify-center">
                         <div className="flex items-center gap-1 mb-1">
                            <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Lời phê</span>
                         </div>
                         <p className="text-sm text-blue-900 line-clamp-2" title={sub.feedback}>
                           {sub.feedback || <span className="italic text-blue-400">Không có nhận xét</span>}
                         </p>
                      </div>

                    </div>
                    
                    {/* Timestamp chấm */}
                    {sub.gradedAt && (
                      <div className="mt-2 text-right">
                         <span className="text-[10px] text-gray-400">Chấm lúc: {new Date(sub.gradedAt).toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-gray-100 pt-4 mt-auto">
                     <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-100 text-orange-700">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div className="text-sm">
                           <span className="font-bold block">Đang chờ chấm điểm</span>
                           <span className="text-xs opacity-80">Giáo viên sẽ sớm phản hồi.</span>
                        </div>
                     </div>
                  </div>
                )}

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                   <Link to={`/assignment/${sub.assignmentId?._id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                      Xem chi tiết bài tập
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                   </Link>
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