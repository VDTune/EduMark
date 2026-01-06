import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import TeacherLayout from '../layouts/TeacherLayout'

const CreateAssignment = () => {
  const { classId } = useParams()
  const [classInfo, setClassInfo] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('Tiếng Việt')
  const [deadline, setDeadline] = useState('')
  const [answerKey, setAnswerKey] = useState('')
  const [totalScore, setTotalScore] = useState('')
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSubmitRequired, setIsSubmitRequired] = useState(true)
  const [allowLate, setAllowLate] = useState(false)
  const [resubmitAllowed, setResubmitAllowed] = useState(true)

  const navigate = useNavigate()
  const finalAnswerKey = totalScore 
  ? answerKey + `\nTổng điểm: ${totalScore}`
  : answerKey

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
        subject, 
        deadline, 
        answerKey : finalAnswerKey, 
        attachments, 
        isSubmitRequired,
        allowLate: isSubmitRequired && !!deadline && allowLate,
        resubmitAllowed: isSubmitRequired && resubmitAllowed
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
    <TeacherLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <Link to={`/class/${classInfo?._id}`} className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại lớp học
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Giao bài tập mới</h1>
          <p className="text-gray-500">
            Lớp: <span className="font-semibold text-gray-900">{classInfo?.name}</span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề bài tập *</label>
              <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề bài tập" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">Hạn nộp</label>
                <input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Mô tả bài tập</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả chi tiết bài tập..." rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y min-h-[100px]" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="answerKey" className="block text-sm font-medium text-gray-700">Đáp án / Hướng dẫn chấm</label>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Dùng cho AI chấm điểm</span>
              </div>
              <textarea id="answerKey" value={answerKey} onChange={(e) => setAnswerKey(e.target.value)} rows="6" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y font-mono text-sm"
                placeholder={"Nhập đáp án chi tiết...\n\nPhần I: Trắc nghiệm (4 điểm)\n1. A\n2. B\n\nPhần II: Tự luận (6 điểm)\n..." }
              />
            </div>

            <div>
              <label htmlFor="totalScore" className="block text-sm font-medium text-gray-700 mb-2">Tổng điểm</label>
              <input id="totalScore" type="number" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} placeholder="Ví dụ: 10" className="w-full sm:w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-4">
              <label className="block text-sm font-bold text-gray-800">Cấu hình nộp bài</label>
              
              <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-600">Yêu cầu học sinh nộp bài trực tuyến:</span>
                  <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="submitRequired" checked={isSubmitRequired === true} onChange={() => setIsSubmitRequired(true)} className="w-4 h-4 text-blue-600 focus:ring-blue-500"/>
                          <span className="text-sm text-gray-700">Có</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="submitRequired" checked={isSubmitRequired === false} onChange={() => setIsSubmitRequired(false)} className="w-4 h-4 text-blue-600 focus:ring-blue-500"/>
                          <span className="text-sm text-gray-700">Không</span>
                      </label>
                  </div>
              </div>

              {isSubmitRequired && (
                <div className="flex flex-col sm:flex-row sm:gap-6 gap-3 mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        <input id="allowLate" type="checkbox" checked={allowLate} onChange={(e) => setAllowLate(e.target.checked)} disabled={!deadline} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" />
                        <label htmlFor="allowLate" className={`text-sm text-gray-700 select-none cursor-pointer ${!deadline ? 'opacity-50' : ''}`}>
                            Cho phép nộp muộn
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                          <input id="resubmitAllowed" type="checkbox" checked={resubmitAllowed} onChange={(e) => setResubmitAllowed(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                        <label htmlFor="resubmitAllowed" className="text-sm text-gray-700 select-none cursor-pointer">
                            Cho phép nộp lại
                        </label>
                    </div>
                </div>
              )}
            </div>         

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Tài liệu đính kèm (URL)</label>
                <button type="button" onClick={addAttachment} className="text-blue-600 hover:text-blue-700 text-sm font-medium bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors">+ Thêm dòng</button>
              </div>
              <div className="space-y-3">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex gap-2">
                    <input type="text" value={attachment} onChange={(e) => updateAttachment(index, e.target.value)} placeholder="https://..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm" />
                    <button type="button" onClick={() => removeAttachment(index)} className="px-3 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">✕</button>
                  </div>
                ))}
                {attachments.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có tài liệu đính kèm</p>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3.5 px-4 rounded-lg font-bold hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              {loading ? 'Đang xử lý...' : 'Giao bài tập ngay'}
            </button>
          </form>
        </div>
      </div>
    </TeacherLayout>
  )
}

export default CreateAssignment