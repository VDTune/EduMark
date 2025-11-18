import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const CreateAssignment = () => {
  const { classId } = useParams()
  const [classInfo, setClassInfo] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // THÊM STATE SUBJECT
  const [subject, setSubject] = useState('Tiếng Việt')
  const [deadline, setDeadline] = useState('')
  const [answerKey, setAnswerKey] = useState('')
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchClassInfo = async () => {
      try {
        const res = await axios.get('/api/classrooms/my')
        const cls = res.data.data.find(c => c._id === classId)
        setClassInfo(cls)
      } catch (err) {
        console.error('Error fetching class info:', err)
      }
    }
    fetchClassInfo()
  }, [classId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await axios.post('/api/assignments', { 
        title, 
        description, 
        classId, 
        subject, // GỬI SUBJECT LÊN SERVER
        deadline, 
        answerKey, 
        attachments 
      })
      alert('Giao bài tập thành công!')
      navigate(`/class/${classId}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi giao bài tập')
    } finally {
      setLoading(false)
    }
  }

  const addAttachment = () => setAttachments([...attachments, ''])
  const updateAttachment = (index, value) => {
    const newAttachments = [...attachments]
    newAttachments[index] = value
    setAttachments(newAttachments)
  }
  const removeAttachment = (index) => setAttachments(attachments.filter((_, i) => i !== index))

  return (
    <div className="min-h-screen bg-gray-10">
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link to={`/class/${classId}`} className="flex items-center text-gray-50 hover:text-gray-90 mb-4 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại lớp học
            </Link>
            <h1 className="h2 text-gray-90 mb-3">Giao bài tập mới</h1>
            <p className="regular-16 text-gray-50">
              Lớp: <span className="font-medium text-gray-90">{classInfo?.name}</span>
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề bài tập *</label>
                <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề bài tập" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
              </div>

              {/* THÊM SELECT MÔN HỌC */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Môn học *</label>
                <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option value="Tiếng Việt">Tiếng Việt</option>
                  <option value="Toán">Toán</option>
                  <option value="Tự nhiên và Xã hội">Tự nhiên và Xã hội</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Khoa học">Khoa học</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Mô tả bài tập</label>
                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả chi tiết bài tập..." rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical" />
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">Hạn nộp</label>
                <input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>

              <div>
                <label htmlFor="answerKey" className="block text-sm font-medium text-gray-700 mb-2">Đáp án (tùy chọn)</label>
                <input id="answerKey" type="text" value={answerKey} onChange={(e) => setAnswerKey(e.target.value)} placeholder="Nhập đáp án hoặc hướng dẫn chấm bài" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>

              <div>
                <div className="flexBetween mb-2">
                  <label className="block text-sm font-medium text-gray-700">Tài liệu đính kèm</label>
                  <button type="button" onClick={addAttachment} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Thêm tài liệu</button>
                </div>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex gap-2">
                      <input type="text" value={attachment} onChange={(e) => updateAttachment(index, e.target.value)} placeholder="URL tài liệu" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                      <button type="button" onClick={() => removeAttachment(index)} className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Đang tạo bài tập...' : 'Giao bài tập'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateAssignment