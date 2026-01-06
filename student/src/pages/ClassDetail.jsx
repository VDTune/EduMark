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

if (loading) return (
      <div className="min-h-screen bg-gray-10 flex items-center justify-center pt-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
  );

  if (error) return (
      <div className="min-h-screen bg-gray-10 pt-24 px-4">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Quay lại</button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-10 pt-5 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Header */}
        <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-4 transition-colors font-medium text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Quay lại danh sách
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{classInfo?.name}</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {classInfo?.teacher?.name}
                        </span>
                        <span>•</span>
                        <span>{assignments.length} bài tập</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Assignment List */}
        {assignments.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
               </div>
               <p className="text-gray-500 font-medium">Chưa có bài tập nào trong lớp này.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
             {assignments.filter(asg => asg.isSubmitRequired).map(asg => {
                 const isOverdue = asg.deadline && new Date(asg.deadline) < new Date();
                 const isLocked = isOverdue && !asg.allowLate;
                 const submissionStatus = getSubmissionStatus(asg._id);
                 const submission = submissions[asg._id];
                 
                 return (
                     <div key={asg._id} className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                         <div className="flex flex-col md:flex-row gap-4 justify-between">
                             {/* Left Info */}
                             <div className="flex-1">
                                 <div className="flex items-center gap-3 mb-2">
                                     <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                         <Link to={`/assignment/${asg._id}`} className="focus:outline-none">
                                            {asg.title}
                                            <span className="absolute inset-0 md:hidden"></span>
                                         </Link>
                                     </h3>
                                     {/* Status Badge */}
                                     <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${submissionStatus.bgColor} ${submissionStatus.color} ${submissionStatus.border}`}>
                                         {submissionStatus.text}
                                     </span>
                                 </div>
                                 
                                 <p className="text-sm text-gray-500 mb-3 line-clamp-2">{asg.description || 'Không có mô tả'}</p>
                                 
                                 <div className="flex items-center gap-4 text-xs font-medium">
                                     {asg.deadline ? (
                                         <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                             {isLocked ? 'Đã khóa' : isOverdue ? 'Quá hạn' : 'Hạn nộp:'} {new Date(asg.deadline).toLocaleString('vi-VN')}
                                         </span>
                                     ) : (
                                         <span className="text-gray-400">Không có thời hạn</span>
                                     )}
                                 </div>
                             </div>

                             {/* Right Action (Desktop) */}
                             <div className="hidden md:flex flex-col items-end justify-center min-w-[120px]">
                                 <Link to={`/assignment/${asg._id}`} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-600 hover:text-white transition-all">
                                     {submission ? 'Xem lại' : 'Làm bài'}
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