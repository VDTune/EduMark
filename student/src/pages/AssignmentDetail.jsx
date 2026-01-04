import { useState, useEffect, useRef} from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const AssignmentDetail = () => {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [mySubmission, setMySubmission] = useState(null) // State mới lưu bài đã nộp
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isEditing, setIsEditing] = useState(false) // Kiểm soát chế độ Xem vs Sửa

  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [assRes, subRes] = await Promise.all([
             axios.get(`/api/assignments/${assignmentId}`),
             axios.get(`/api/submissions/mine`).catch(() => ({ data: { data: [] } })) 
        ]);    

        if (assRes.data.success) {
          setAssignment(assRes.data.data)
        } else {
          throw new Error(assRes.data.message || 'Failed to load assignment')
        }

        const mySubs = subRes.data?.data || [];
        const foundSub = mySubs.find(s => (s.assignmentId?._id || s.assignmentId) === assignmentId);

        if (foundSub) {
            setMySubmission(foundSub);
            setContent(foundSub.content || '');
        } else {
            setIsEditing(true); // Nếu chưa nộp thì bật chế độ nhập liệu luôn
        }
      } catch (err) {
        console.error('Error fetching assignment:', err)
        if (err.response && err.response.status === 401) {
            alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
            localStorage.removeItem('token');
            navigate('/login'); 
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [assignmentId])

  const handleFileSelect = (e) => {
    if (e.target.files) {
        // Convert FileList sang Array để cộng dồn vào mảng cũ
        const newSelectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...newSelectedFiles]);
    }
    // Reset value input để cho phép chọn lại cùng 1 file nếu lỡ xóa nhầm
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  }

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
      let res;
  
      if (mySubmission) {
        // --- TRƯỜNG HỢP NỘP LẠI (UPDATE) ---
        res = await axios.put(`/api/submissions/${mySubmission._id}`, formData)
      } else {
          res = await axios.post('/api/submissions/submit', formData)
      }
      
      if (res.data.success) {
        alert(mySubmission ? 'Cập nhật bài nộp thành công!' : 'Nộp bài thành công!')
        setMySubmission(res.data.data) // Lưu bài đã nộp vào state
        setFiles([])
        setIsEditing(false)
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

  const renderExistingFiles = (filePaths) => {
      if (!Array.isArray(filePaths) || filePaths.length === 0) return null;
      return (
          <div className="mt-2 space-y-1">
              <p className="text-sm font-medium text-gray-700">File đã nộp:</p>
              {filePaths.map((path, idx) => (
                  <a key={idx} href={`http://localhost:5000/${path}`} target="_blank" rel="noreferrer" className="block text-blue-600 hover:underline text-sm truncate">
                      📄 {path.split('/').pop()}
                  </a>
              ))}
          </div>
      )
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

  const isGraded = mySubmission?.grade !== null && mySubmission.grade !== undefined;

  const canEdit = !isGraded && (!mySubmission || (assignment.resubmitAllowed !== false && (!isOverdue || assignment.allowLate)));

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
              {/* TRƯỜNG HỢP 1: ĐÃ NỘP BÀI VÀ KHÔNG Ở CHẾ ĐỘ SỬA */}
              {mySubmission && !isEditing ? (
                  <div className="bg-white rounded-xl border border-green-200 p-6 sticky top-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 text-green-600">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <h3 className="text-lg font-bold">Bạn đã nộp bài</h3>
                      </div>

                      {isGraded && (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                          <p className="text-sm text-gray-600 uppercase font-bold">Điểm số</p>
                          <p className="text-3xl font-bold text-yellow-600">{mySubmission.grade}</p>
                          {mySubmission.feedback && (
                            <p className="text-sm text-gray-600 mt-2 italic">"{mySubmission.feedback}"</p>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-4 mb-6">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Nội dung đã nộp:</label>
                              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded mt-1">{mySubmission.content || "(Không có nội dung văn bản)"}</p>
                          </div>
                          {renderExistingFiles(mySubmission.fileUrl)}
                          <p className="text-xs text-gray-400 mt-2">Nộp lúc: {new Date(mySubmission.createdAt).toLocaleString('vi-VN')}</p>
                      </div>

                      {canEdit && (
                          <button 
                              onClick={() => setIsEditing(true)}
                              className="w-full py-2 px-4 bg-white border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                          >
                              Nộp lại / Chỉnh sửa
                          </button>
                      )}
                  </div>
              ) : (
                /* TRƯỜNG HỢP 2: CHƯA NỘP BÀI HOẶC NỘP LẠI */
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
                  <h3 className="text-lg font-bold text-gray-90 mb-4">
                    {mySubmission ? 'Cặp nhật bài làm' : 'Nộp bài tập'}
                    </h3>
                  
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
                        disabled={submitted || submitting }
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
                        onChange= {handleFileSelect}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={submitted || submitting || (isOverdue && !assignment.allowLate)}
                      />

                      {files && files.length > 0 && (
                        <ul className="text-sm text-green-600 mt-2 space-y-1">
                          {files.map((file, index) => (
                            <li key={index} className="flex justify-between items-center text-sm">
                              <span className="truncate text-gray-700 max-w-[80%]">📄 {file.name}</span>
                              <button 
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:bg-red-100 p-1 rounded transition-colors"
                                title="Xóa file này"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className = "flex gap-2">
                      {mySubmission && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
                        > Hủy
                        </button>
                      )}

                      <button 
                        type="submit"
                        // onChange={() => handleSubmit()}
                        disabled={ submitted || submitting || (isOverdue && !assignment.allowLate) || isGraded}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                          submitted || isGraded
                            ? 'bg-gray-500 text-white cursor-default':
                            submitting || (isOverdue && !assignment.allowLate)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }`}
                      >
                        {isGraded ? 'Đã chấm điểm' : submitted ? (
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
                    </div>

                    {isOverdue && (
                      <p className={`text-sm text-center ${assignment.allowLate ? 'text-orange-600' : 'text-red-600'}`}>
                        {assignment.allowLate 
                          ? 'Bài tập đã quá hạn. Bạn vẫn có thể nộp bài muộn.' 
                          : 'Bài tập đã quá hạn và không cho phép nộp muộn.'}
                      </p>
                    )}
                  </div>
                </form>
              )}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssignmentDetail