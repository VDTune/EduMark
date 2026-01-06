import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import TeacherLayout from '../layouts/TeacherLayout' // Import Layout

const SubmissionDetail = () => {
    const { assignmentId, studentId } = useParams()
    const navigate = useNavigate()
    const [submission, setSubmission] = useState(null)
    const [loading, setLoading] = useState(true)
    const [gradeInput, setGradeInput] = useState('')
    const [feedbackInput, setFeedbackInput] = useState('')
    const [saving, setSaving] = useState(false)
    const [previewImg, setPreviewImg] = useState(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // ... (GIỮ NGUYÊN LOGIC FETCH DATA, SAVE GRADE, ETC.)
    // Copy lại logic cũ vào đây

    const images = Array.isArray(submission?.fileUrl) ? submission.fileUrl : []
    useEffect(() => { if (images.length > 0) setCurrentImageIndex(0) }, [images])

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const subRes = await axios.get(`/api/submissions/assignment/${assignmentId}`)
                const list = subRes.data.data || []
                const found = list.find(s => s.studentId?._id === studentId)
                setSubmission(found || null)
                if (found) {
                    if (found.grade !== null && found.grade !== undefined) setGradeInput(found.grade);
                    if (found.feedback) setFeedbackInput(found.feedback);
                }
            } catch (err) { alert("Không thể tải bài nộp") } finally { setLoading(false) }
        }
        fetchData()
    }, [assignmentId, studentId])

    const handleSaveGrade = async (gradeOverride = null, feedbackOverride = null) => {
        /* Logic cũ giữ nguyên */
        const finalGrade = gradeOverride !== null ? gradeOverride : gradeInput;
        const finalFeedback = feedbackOverride !== null ? feedbackOverride : feedbackInput;
        if (finalGrade === '' || finalGrade === null) return alert("Vui lòng nhập điểm");
        try {
            setSaving(true)
            await axios.post(`/api/submissions/${submission._id}/grade`, { grade: finalGrade, feedback: finalFeedback })
            setGradeInput(finalGrade); setFeedbackInput(finalFeedback);
            alert("CHẤM ĐIỂM THÀNH CÔNG!");
            navigate(`/assignment/${assignmentId}/submissions`)
        } catch (err) { alert("Lỗi khi lưu điểm") } finally { setSaving(false) }
    }

    const handleApproveAI = () => { if (submission.aiScore === null) return alert("Chưa có điểm AI!"); handleSaveGrade(submission.aiScore, submission.aiFeedback); };
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const getImageUrl = (path) => {
        if (!path) return "";
        // Nối link backend vào
        return path.startsWith("http") ? path : `${API_URL}/${path.replace(/^\/+/, "")}`
    }
    const renderAIDetail = (data) => { /* Logic cũ giữ nguyên */ if (!data) return <em className="text-gray-400">Chưa có nhận xét</em>; let parsedData = data; if (typeof data === 'string') { try { parsedData = JSON.parse(data); } catch (e) { return data; } } if (Array.isArray(parsedData) && parsedData.length > 0) parsedData = parsedData[0]; if (typeof parsedData !== 'object' || parsedData === null) return parsedData; return Object.entries(parsedData).map(([sectionName, content], index) => (<div key={index} className="mb-3 border-b border-gray-100 pb-2 last:border-0"><h5 className="font-bold text-gray-800 text-sm">{sectionName}</h5><div className="ml-2 text-sm"><p><span className="font-medium text-gray-600">Điểm:</span> {content.score}</p><p><span className="font-medium text-gray-600">Nhận xét:</span> {content.comment}</p></div></div>)); };

    if (loading || !submission) {
        return (
            <TeacherLayout>
                <div className="flexCenter h-[calc(100vh-80px)]">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-500">Đang tải bài làm...</span>
                </div>
            </TeacherLayout>
        )
    }

    return (
        <TeacherLayout>
            <div className="mb-6">
                <Link to={`/assignment/${assignmentId}/submissions`} className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-4 transition-colors text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Danh sách bài nộp
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Chấm bài chi tiết</h2>
                        <p className="text-gray-500">Học sinh: <span className="font-bold text-blue-600 text-lg ml-1">{submission.studentId?.name}</span></p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-bold border flex items-center gap-2 w-fit ${submission.grade !== undefined && submission.grade !== null
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${submission.grade !== undefined && submission.grade !== null ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        {submission.grade !== undefined && submission.grade !== null ? 'Đã chấm điểm' : 'Chưa chấm điểm'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* LEFT COLUMN: IMAGE VIEWER (3/5 width) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1 overflow-hidden">
                        <div className="bg-gray-900 rounded-xl relative group min-h-[400px] flex items-center justify-center overflow-hidden">
                            {images.length === 0 ? (
                                <p className="text-gray-400">Học sinh không nộp ảnh</p>
                            ) : (
                                <>
                                    <img
                                        src={getImageUrl(images[currentImageIndex])}
                                        alt="Student Work"
                                        className="max-h-[80vh] w-full object-contain cursor-zoom-in"
                                        onClick={() => setPreviewImg(getImageUrl(images[currentImageIndex]))}
                                    />
                                    {/* Navigation Arrows */}
                                    {images.length > 1 && (
                                        <>
                                            <button onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)} className="absolute left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                                            <button onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)} className="absolute right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                                        </>
                                    )}
                                    {/* Page Indicator */}
                                    <div className="absolute bottom-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-md">
                                        Trang {currentImageIndex + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-2 p-4 overflow-x-auto">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${currentImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Text Box */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Nội dung trích xuất (OCR)
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100 max-h-60 overflow-y-auto custom-scrollbar">
                            {submission.content || "Không có nội dung văn bản."}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: GRADING & AI (2/5 width) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* AI SUGGESTION */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-indigo-900">AI Đề xuất</h3>
                                <p className="text-xs text-indigo-600 font-medium">Phân tích tự động</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-indigo-100 mb-4 flex justify-between items-center shadow-sm">
                            <span className="text-gray-600 font-medium">Điểm số:</span>
                            <span className="text-3xl font-bold text-indigo-600">{submission.aiScore ?? "--"}</span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chi tiết đánh giá:</p>
                            <div className="bg-white/80 rounded-xl p-3 text-sm text-gray-700 max-h-60 overflow-y-auto custom-scrollbar border border-indigo-50">
                                {renderAIDetail(submission.aidetail)}
                            </div>
                        </div>

                        {submission.aiScore !== null && (
                            <button
                                onClick={handleApproveAI}
                                disabled={saving}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-md hover:shadow-indigo-200 flex justify-center items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Sử dụng kết quả này
                            </button>
                        )}
                    </div>

                    {/* TEACHER GRADING FORM */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md sticky top-24">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Giáo viên chấm</h3>
                                <p className="text-xs text-gray-500">Quyết định cuối cùng</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Điểm số (0-10)</label>
                                <input
                                    type="number"
                                    value={gradeInput}
                                    onChange={(e) => setGradeInput(e.target.value)}
                                    className="w-full text-center text-2xl font-bold text-blue-600 border border-gray-300 rounded-xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-300"
                                    placeholder="--"
                                    min="0" max="10" step="0.1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Lời phê / Nhận xét</label>
                                <textarea
                                    value={feedbackInput}
                                    onChange={(e) => setFeedbackInput(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-32 resize-none text-sm"
                                    placeholder="Nhập nhận xét cho học sinh..."
                                ></textarea>
                            </div>

                            <button
                                onClick={() => handleSaveGrade()}
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu kết quả'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIGHTBOX */}
            {previewImg && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-md" onClick={() => setPreviewImg(null)}>
                    <img src={getImageUrl(previewImg)} className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl" alt="Preview" />
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
            )}
        </TeacherLayout>
    )
}

export default SubmissionDetail