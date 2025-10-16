import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import AuthContext from '../context/AuthContext'

const ClassDetail = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [assignments, setAssignments] = useState([])
  const [classInfo, setClassInfo] = useState(null)
  const [submissions, setSubmissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Fetching data for class:', classId)
        
        // Fetch thông tin lớp học và bài tập riêng biệt để tránh lỗi Promise
        try {
          const classRes = await axios.get(`/api/classrooms/${classId}`)
          if (isMounted && classRes.data.success) {
            setClassInfo(classRes.data.data)
          } else if (isMounted) {
            throw new Error(classRes.data.message || 'Failed to load class info')
          }
        } catch (err) {
          if (isMounted) {
            console.error('Error fetching class info:', err)
            throw new Error(err.response?.data?.message || err.message || 'Không thể tải thông tin lớp học')
          }
          return
        }

        try {
          const assignmentsRes = await axios.get(`/api/assignments/class/${classId}`)
          if (isMounted && assignmentsRes.data.success) {
            const assignmentsData = assignmentsRes.data.data || []
            setAssignments(assignmentsData)

            // Nếu là học sinh, fetch bài nộp của mình
            if (user?.role === 'student') {
              await fetchStudentSubmissions(assignmentsData)
            }
          } else if (isMounted) {
            throw new Error(assignmentsRes.data.message || 'Failed to load assignments')
          }
        } catch (err) {
          if (isMounted) {
            console.error('Error fetching assignments:', err)
            throw new Error(err.response?.data?.message || err.message || 'Không thể tải danh sách bài tập')
          }
        }
        
      } catch (err) {
        if (isMounted) {
          console.error('Error in fetchData:', err)
          setError(err.message || 'Không thể tải dữ liệu lớp học')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const fetchStudentSubmissions = async (assignmentsData) => {
      try {
        console.log('Fetching student submissions for assignments:', assignmentsData.length)
        const submissionsRes = await axios.get('/api/submissions/mine')
        
        if (submissionsRes.data.success) {
          const submissionsData = submissionsRes.data.data || []
          console.log('Raw submissions data:', submissionsData)
          
          // Tạo object với key là assignmentId và value là submission
          const submissionsMap = {}
          submissionsData.forEach(sub => {
            // Kiểm tra cả hai cách truy cập assignmentId
            const assignmentId = sub.assignmentId?._id || sub.assignmentId
            if (assignmentId) {
              submissionsMap[assignmentId] = sub
              console.log(`Found submission for assignment ${assignmentId}:`, sub)
            }
          })
          
          if (isMounted) {
            setSubmissions(submissionsMap)
            console.log('Final submissions map:', submissionsMap)
          }
        } else {
          console.warn('Submissions API returned unsuccessful:', submissionsRes.data)
        }
      } catch (err) {
        console.warn('Error fetching submissions (non-critical):', err)
        // Không set error vì đây chỉ là thông tin bổ sung
      }
    }

    if (user && classId) {
      fetchData()
    }

    return () => {
      isMounted = false
    }
  }, [classId, user])

  const getSubmissionStatus = (assignmentId) => {
    const submission = submissions[assignmentId]
    console.log(`Getting status for assignment ${assignmentId}:`, submission)
    
    if (!submission) {
      return { 
        status: 'not_submitted', 
        text: 'Chưa nộp', 
        color: 'text-red-600', 
        bgColor: 'bg-red-50',
        icon: '❌'
      }
    }
    
    // Kiểm tra grade có tồn tại và là số hợp lệ
    if (submission.grade !== undefined && submission.grade !== null && !isNaN(submission.grade)) {
      return { 
        status: 'graded', 
        text: `Điểm: ${parseFloat(submission.grade).toFixed(1)}`,
        color: 'text-green-600', 
        bgColor: 'bg-green-50',
        icon: '✅'
      }
    }
    
    return { 
      status: 'submitted', 
      text: 'Đã nộp', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      icon: '📤'
    }
  }

  const getGradeColor = (grade) => {
    if (grade === undefined || grade === null || isNaN(grade)) return 'text-gray-50'
    const numGrade = parseFloat(grade)
    if (numGrade >= 8) return 'text-green-600'
    if (numGrade >= 6.5) return 'text-yellow-600'
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-10 flexCenter">
        <div className="text-center bg-white p-8 rounded-xl shadow-md">
          <div className="text-red-500 text-xl mb-4">❌ {error}</div>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate(-1)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Quay lại
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-10">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-padd-container">
          <div className="flexBetween py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-50 hover:text-gray-90 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại
              </button>
              <div className="w-px h-6 bg-gray-200"></div>
              <div>
                <h1 className="medium-18 text-gray-90">{classInfo?.name}</h1>
                <p className="regular-14 text-gray-50">
                  Giáo viên: {classInfo?.teacher?.name || 'Chưa có thông tin'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-padd-container py-8">
        <div className="flexBetween mb-8">
          <div>
            <h1 className="h1 text-gray-90 mb-2">Bài tập trong lớp</h1>
            <p className="regular-16 text-gray-50">
              Tổng số bài tập: {assignments.length}
              {classInfo?.students && ` • Số học sinh: ${classInfo.students.length}`}
            </p>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="flexCenter flex-col py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-20 h-20 bg-gray-10 rounded-full flexCenter mb-4">
              <svg className="w-8 h-8 text-gray-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="medium-20 text-gray-90 mb-2">Chưa có bài tập nào</h3>
            <p className="regular-15 text-gray-50 text-center">
              {user?.role === 'teacher'
                ? 'Hãy tạo bài tập mới cho lớp học của bạn.'
                : 'Giáo viên sẽ đăng bài tập mới trong thời gian tới.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(asg => {
              const isOverdue = asg.deadline && new Date(asg.deadline) < new Date()
              const isDueSoon = asg.deadline && new Date(asg.deadline) > new Date() && new Date(asg.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)
              const submissionStatus = getSubmissionStatus(asg._id)
              const submission = submissions[asg._id]
              
              console.log(`Rendering assignment ${asg._id}:`, { submission, submissionStatus })
              
              return (
                <div 
                  key={asg._id} 
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-blue-200"
                >
                  <div className="p-6">
                    <div className="flexBetween mb-3">
                      <div className="flex-1">
                        <Link 
                          to={`/assignment/${asg._id}`}
                          className="medium-18 text-gray-90 hover:text-blue-600 transition-colors mb-1 block"
                        >
                          {asg.title}
                        </Link>
                        {asg.teacherId && (
                          <p className="regular-14 text-gray-30">
                            Giáo viên: {asg.teacherId.name}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Trạng thái nộp bài và điểm số - CHỈ HIỂN THỊ CHO HỌC SINH */}
                        {user?.role === 'student' && (
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${submissionStatus.bgColor} ${submissionStatus.color} border`}>
                            <span>{submissionStatus.icon}</span>
                            <span>{submissionStatus.text}</span>
                          </div>
                        )}

                        {/* Trạng thái deadline */}
                        {asg.deadline && (
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            isOverdue ? 'bg-red-50 text-red-700 border border-red-200' : 
                            isDueSoon ? 'bg-orange-50 text-orange-700 border border-orange-200' : 
                            'bg-green-50 text-green-700 border border-green-200'
                          }`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {isOverdue ? 'Quá hạn' : isDueSoon ? 'Sắp đến hạn' : 'Còn thời gian'}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="regular-15 text-gray-50 mb-4 line-clamp-2">
                      {asg.description || 'Không có mô tả'}
                    </p>

                    {/* Hiển thị thông tin chi tiết về bài nộp nếu có - CHỈ CHO HỌC SINH */}
                    {user?.role === 'student' && submission && (
                      <div className="mb-4 p-3 bg-gray-10 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-50">
                              📅 Nộp lúc: {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                            </span>
                            
                            {submission.grade !== undefined && submission.grade !== null && !isNaN(submission.grade) && (
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${getGradeColor(submission.grade)}`}>
                                  🎯 Điểm: {parseFloat(submission.grade).toFixed(1)}
                                </span>
                                {submission.feedback && (
                                  <span className="text-blue-600">
                                    💬 Có phản hồi
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {submission.fileUrl && (
                            <div className="flex items-center gap-1 text-blue-600 text-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              📎 Có file
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flexBetween">
                      <div className="flex items-center gap-4 text-sm text-gray-30">
                        {asg.deadline ? (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Hạn nộp: {new Date(asg.deadline).toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-gray-20">Không có hạn nộp</span>
                        )}
                      </div>
                      <Link 
                        to={`/assignment/${asg._id}`}
                        className="text-blue-600 medium-14 hover:translate-x-1 transition-transform inline-block"
                      >
                        {user?.role === 'student' ? 'Xem chi tiết →' : 'Xem bài tập →'}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClassDetail