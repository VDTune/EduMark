import { useState, useEffect, useRef } from 'react'
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

    if (loading) return (
        <div className="min-h-screen bg-gray-10 pt-20 flex justify-center"><div className="loading-spinner"></div></div>
    );
    if (!assignment) return null;

    const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();
    const isGraded = mySubmission?.grade !== null && mySubmission?.grade !== undefined;
    const canEdit = !isGraded && (!mySubmission || (assignment.resubmitAllowed !== false && (!isOverdue || assignment.allowLate)));

    return (
        <div className="min-h-screen bg-gray-10 pt-5 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Button */}
                <button onClick={() => navigate(-1)} className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors font-medium text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" /></svg>
                    Quay lại
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: INFO */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <div className="border-b border-gray-100 pb-4 mb-4">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        {assignment.teacherId?.name}
                                    </span>
                                    <span>•</span>
                                    <span>{assignment.classId?.name}</span>
                                </div>
                            </div>

                            {/* Deadline Box */}
                            {assignment.deadline && (
                                <div className={`flex items-center gap-3 p-3 rounded-xl mb-6 border ${isOverdue ? 'bg-red-50 border-red-100 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                                    <div className={`p-2 rounded-lg bg-white ${isOverdue ? 'text-red-500' : 'text-blue-500'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-80">{isOverdue ? 'Đã quá hạn' : 'Hạn nộp bài'}</p>
                                        <p className="font-semibold">{new Date(assignment.deadline).toLocaleString('vi-VN')}</p>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                                {assignment.description || <span className="italic text-gray-400">Không có mô tả chi tiết.</span>}
                            </div>

                            {/* Attachments */}
                            {assignment.attachments?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        Tài liệu đính kèm
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {assignment.attachments.map((att, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                                                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs">PDF</div>
                                                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 truncate">Tài liệu {idx + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SUBMISSION FORM */}
                    {assignment.isSubmitRequired && (
                        <div className="lg:col-span-1">
                            {/* 1. VIEW MODE (ALREADY SUBMITTED) */}
                            {mySubmission && !isEditing ? (
                                <div className="bg-white rounded-2xl border border-green-200 p-6 shadow-sm sticky top-24">
                                    <div className="flex items-center gap-3 mb-6 text-green-700 bg-green-50 p-4 rounded-xl border border-green-100">
                                        <div className="bg-white p-1 rounded-full"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                                        <h3 className="font-bold">Đã nộp bài</h3>
                                    </div>

                                    {isGraded && (
                                        <div className="mb-6 text-center">
                                            <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-orange-100 min-w-[150px]">
                                                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Điểm số</p>
                                                <p className="text-4xl font-bold text-orange-600">{mySubmission.grade}</p>
                                            </div>
                                            {mySubmission.feedback && <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">"{mySubmission.feedback}"</p>}
                                        </div>
                                    )}

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase">Nội dung</label>
                                            <div className="mt-1 text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
                                                {mySubmission.content || "Không có nội dung văn bản"}
                                            </div>
                                        </div>
                                        {mySubmission.fileUrl?.length > 0 && (
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase">File đã nộp</label>
                                                <div className="mt-1 space-y-2">
                                                    {mySubmission.fileUrl.map((path, i) => (
                                                        <a key={i} href={`http://localhost:5000/${path}`} target="_blank" className="flex items-center gap-2 text-sm text-blue-600 hover:underline bg-blue-50 p-2 rounded-lg">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            <span className="truncate">{path.split('/').pop()}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-xs text-center text-gray-400 mt-4">Nộp lúc: {new Date(mySubmission.createdAt).toLocaleString('vi-VN')}</p>
                                    </div>

                                    {canEdit && (
                                        <button onClick={() => setIsEditing(true)} className="w-full py-2.5 px-4 bg-white border border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm">
                                            Nộp lại bài
                                        </button>
                                    )}
                                </div>
                            ) : (
                                /* 2. EDIT MODE */
                                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md sticky top-24">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        {mySubmission ? 'Cập nhật bài làm' : 'Nộp bài tập'}
                                    </h3>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung văn bản</label>
                                            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors h-32 resize-none text-sm" placeholder="Nhập câu trả lời..." disabled={submitting} />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Đính kèm file</label>
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                    <p className="text-sm text-gray-500 font-medium">Click để chọn file</p>
                                                </div>
                                                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} disabled={submitting} />
                                            </label>

                                            {/* File list */}
                                            {files.length > 0 && (
                                                <ul className="mt-3 space-y-2">
                                                    {files.map((file, i) => (
                                                        <li key={i} className="flex justify-between items-center bg-blue-50 p-2 rounded-lg border border-blue-100 text-sm">
                                                            <span className="truncate text-blue-700 font-medium max-w-[80%]">{file.name}</span>
                                                            <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        {mySubmission && <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors">Hủy</button>}
                                        <button type="submit" disabled={submitting || (isOverdue && !assignment.allowLate)} className={`flex-1 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${submitting ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}>
                                            {submitting ? 'Đang gửi...' : 'Nộp bài'}
                                        </button>
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