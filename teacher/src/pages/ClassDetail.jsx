import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

const ClassDetail = () => {
  const { classId } = useParams()
  const [classInfo, setClassInfo] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [students, setStudents] = useState([])
  const [studentEmail, setStudentEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [addingStudent, setAddingStudent] = useState(false)
  const [filterSubject, setFilterSubject] = useState('all')

  const subjects = ['Tiếng Việt', 'Toán', 'Tự nhiên và Xã hội', 'Tiếng Anh', 'Khoa học']

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Lấy thông tin lớp
        const classRes = await axios.get('/api/classrooms/my')
        const cls = classRes.data.data.find(c => c._id === classId)
        setClassInfo(cls)
        setStudents(cls?.students || [])
        
        // Lấy assignments
        const assignmentRes = await axios.get(`/api/assignments/class/${classId}`)
        setAssignments(assignmentRes.data.data || [])
        
      } catch (err) {
        console.error('Error fetching data:', err)
        alert('Không thể tải thông tin lớp học')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [classId])

  const handleAddStudent = async (e) => {
    e.preventDefault()
    const emails = studentEmail.split(/[\n, ]+/).filter(email => email.trim() !== '')
    if (emails.length === 0) {
      alert('Vui lòng nhập email học sinh.')
      return
    }

    try {
      setAddingStudent(true)
      const results = await Promise.allSettled(
        emails.map(email => axios.post(`/api/classrooms/${classId}/add-student`, { studentEmail: email.trim() }))
      )

      const successfulAdds = results.filter(r => r.status === 'fulfilled').length
      const failedAdds = results.filter(r => r.status === 'rejected')

      let alertMessage = ''
      if (successfulAdds > 0) {
        alertMessage += `Thêm thành công ${successfulAdds} học sinh.\n`
      }
      if (failedAdds.length > 0) {
        const failedEmails = emails.filter((_, index) => results[index].status === 'rejected')
        alertMessage += `Thất bại khi thêm ${failedAdds.length} học sinh: ${failedEmails.join(', ')}.`
      }
      alert(alertMessage.trim())

      setStudentEmail('')
      
      const classRes = await axios.get('/api/classrooms/my')
      const cls = classRes.data.data.find(c => c._id === classId)
      setStudents(cls?.students || [])
    } catch (err) {
      alert('Có lỗi xảy ra trong quá trình thêm học sinh.')
    } finally {
      setAddingStudent(false)
    }
  }

  // LOGIC LỌC BÀI TẬP
  const filteredAssignments = filterSubject === 'all'
    ? assignments
    : assignments.filter(a => a.subject === filterSubject)

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
        <div className="mb-8">
          <Link to="/" className="flex items-center text-gray-50 hover:text-gray-90 mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại
          </Link>
          <div className="flexBetween">
            <div>
              <h1 className="h1 text-gray-90 mb-2">{classInfo?.name}</h1>
              <p className="regular-16 text-gray-50">Mã lớp: {classId}</p>
            </div>
            <Link 
              to={`/class/${classId}/create-assignment`}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200"
            >
              + Giao bài tập
            </Link>
          </div>
        </div>

        {/* THANH LỌC MÔN HỌC - ĐÃ SỬA MÀU HOVER */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setFilterSubject('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
              filterSubject === 'all' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-10 hover:text-blue-600 hover:border-blue-200'
            }`}
          >
            Tất cả
          </button>
          {subjects.map(sub => (
            <button
              key={sub}
              onClick={() => setFilterSubject(sub)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                filterSubject === sub 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-10 hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flexBetween mb-6">
                <h2 className="text-2xl font-bold text-gray-90">Bài tập</h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {filteredAssignments.length} bài tập
                </span>
              </div>
              
              <div className="space-y-4">
                {filteredAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-50">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Chưa có bài tập nào cho môn này</p>
                  </div>
                ) : (
                  filteredAssignments.map(asg => (
                    <div key={asg._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors group">
                      <div className="flexBetween mb-2">
                        <h3 className="text-lg font-semibold text-gray-90 group-hover:text-blue-600 transition-colors">{asg.title}</h3>
                        {asg.deadline && (
                          <span className="text-sm text-gray-50">
                            {new Date(asg.deadline).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      
                      {/* HIỂN THỊ TAG SUBJECT */}
                      <div className="mb-3">
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium border border-gray-200">
                          {asg.subject || 'Khác'}
                        </span>
                      </div>

                      <p className="text-gray-50 mb-3 line-clamp-2">{asg.description}</p>
                      <div className="flexBetween">
                        <span className="text-sm text-gray-30">
                          {asg.attachments?.length || 0} đính kèm
                        </span>
                        <Link 
                          to={`/assignment/${asg._id}/submissions`}
                          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          Xem bài nộp →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-90 mb-4">Thêm học sinh</h3>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <textarea value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="Nhập email học sinh, mỗi email một dòng..." rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
                </div>
                <button type="submit" disabled={addingStudent} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50">
                  {addingStudent ? 'Đang thêm...' : 'Thêm học sinh'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flexBetween mb-4">
                <h3 className="text-lg font-semibold text-gray-90">Học sinh</h3>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                  {students.length} học sinh
                </span>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {students.length === 0 ? (
                  <p className="text-gray-50 text-center py-4">Chưa có học sinh nào</p>
                ) : (
                  students.map(stu => (
                    <div key={stu._id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flexCenter text-white text-sm">
                        {stu.name?.charAt(0)?.toUpperCase() || 'H'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-90">{stu.name}</p>
                        <p className="text-sm text-gray-50">{stu.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClassDetail