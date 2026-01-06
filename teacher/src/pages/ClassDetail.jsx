import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import TeacherLayout from '../layouts/TeacherLayout'

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
        const classRes = await axios.get('/api/classrooms/my')
        const cls = classRes.data.data.find(c => c._id === classId)
        setClassInfo(cls)
        setStudents(cls?.students || [])
        
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
      if (successfulAdds > 0) alertMessage += `Thêm thành công ${successfulAdds} học sinh.\n`
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

  const filteredAssignments = filterSubject === 'all'
    ? assignments
    : assignments.filter(a => a.subject === filterSubject)

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
          <span className="ml-3 text-gray-500">Đang tải...</span>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="mb-6 sm:mb-8">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại danh sách lớp
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{classInfo?.name}</h1>
            <p className="text-gray-500">Mã lớp: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{classId}</span></p>
          </div>
          <Link 
            to={`/class/${classId}/create-assignment`}
            className="w-full sm:w-auto text-center bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-md"
          >
            + Giao bài tập
          </Link>
        </div>
      </div>

      {/* THANH LỌC MÔN HỌC (Cuộn ngang trên mobile) */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFilterSubject('all')}
          className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
            filterSubject === 'all' 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200'
          }`}
        >
          Tất cả
        </button>
        {subjects.map(sub => (
          <button
            key={sub}
            onClick={() => setFilterSubject(sub)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
              filterSubject === sub 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Bài tập</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                {filteredAssignments.length}
              </span>
            </div>
            
            <div className="space-y-4">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Chưa có bài tập nào cho môn này</p>
                </div>
              ) : (
                filteredAssignments.map(asg => (
                  <div key={asg._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all duration-200 group bg-white hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{asg.title}</h3>
                      {asg.deadline && (
                        <span className="text-xs text-gray-500 whitespace-nowrap bg-gray-50 px-2 py-1 rounded">
                          Hạn: {new Date(asg.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium border border-gray-200">
                        {asg.subject || 'Khác'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{asg.description}</p>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        {asg.attachments?.length || 0} đính kèm
                      </span>
                      <Link 
                        to={`/assignment/${asg._id}/submissions`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        Xem bài nộp <span className="text-lg">→</span>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thêm học sinh</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <textarea value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="Nhập email học sinh, mỗi email một dòng..." rows="4" className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
              </div>
              <button type="submit" disabled={addingStudent} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 text-sm shadow-sm">
                {addingStudent ? 'Đang thêm...' : 'Thêm danh sách'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Danh sách lớp</h3>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                {students.length}
              </span>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {students.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">Chưa có học sinh nào</p>
              ) : (
                students.map(stu => (
                  <div key={stu._id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {stu.name?.charAt(0)?.toUpperCase() || 'H'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{stu.name}</p>
                      <p className="text-xs text-gray-500 truncate">{stu.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  )
}

export default ClassDetail