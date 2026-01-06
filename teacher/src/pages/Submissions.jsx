import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TeacherLayout from '../layouts/TeacherLayout' // Import Layout

const Submissions = () => {
  const { assignmentId } = useParams()
  const [submissions, setSubmissions] = useState([])
  const [assignmentInfo, setAssignmentInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allStudents, setAllStudents] = useState([])
  const [teacherName, setTeacherName] = useState('')

  const [uploading, setUploading] = useState(false) 
  const [isProcessing, setIsProcessing] = useState(false) 
  const [gradingFinished, setGradingFinished] = useState(false) 
  const isProcessingRef = useRef(isProcessing);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const fetchData = async (isSilent = false) => {
      try {
        if (!isSilent) setLoading(true)
        
        const assignmentRes = await axios.get(`/api/assignments/${assignmentId}`)
        const assignmentData = assignmentRes.data.data
        setAssignmentInfo(assignmentData)
        
        const submissionsRes = await axios.get(`/api/submissions/assignment/${assignmentId}`)
        const subs = submissionsRes.data.data || []
        setSubmissions(subs)

        if (isProcessingRef.current) {
         const pending = subs.filter(s => s.aiScore === null || s.aiScore === undefined);
         if (subs.length > 0 && pending.length === 0) {
            setIsProcessing(false);
            setGradingFinished(true);
            setTimeout(() => setGradingFinished(false), 5000); 
         }
      }
        
        if (assignmentData && assignmentData.classId && !isSilent) {
            const classId = assignmentData.classId._id || assignmentData.classId;
            const classRes = await axios.get(`/api/classrooms/my`); 
            const currentClass = classRes.data.data.find(c => c._id === classId)
            setAllStudents(currentClass?.students || []);
            setTeacherName(currentClass?.teacher?.name || '');
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        if (!isSilent) alert('Không thể tải thông tin bài nộp')
      } finally {
        if (!isSilent) setLoading(false)
      }
    }

  useEffect(() => {
    fetchData()
  }, [assignmentId])

  useEffect(() => {
    let interval;
    if (isProcessing) {
        interval = setInterval(() => {
            fetchData(true); 
        }, 3000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Logic thống kê và Bảng điểm
  const statistics = useMemo(() => {
    if (submissions.length === 0) return null;

    let excellent = 0; // >= 8
    let good = 0;      // 6.5 - <8
    let average = 0;   // 5 - <6.5
    let weak = 0;      // < 5
    let totalScore = 0;
    let count = 0;
    let max = 0;
    let min = 10;

    submissions.forEach(sub => {
        // Ưu tiên lấy điểm giáo viên chấm, nếu chưa thì lấy điểm AI
        let score = null;
        if (sub.grade !== undefined && sub.grade !== null) {
            score = sub.grade;
        } else if (sub.aiScore !== undefined && sub.aiScore !== null) {
            score = sub.aiScore;
        }
        
        if (score !== null) {
            const numScore = Number(score);
            totalScore += numScore;
            count++;
            if (numScore > max) max = numScore;
            if (numScore < min) min = numScore;

            if (numScore >= 8) excellent++;
            else if (numScore >= 6.5) good++;
            else if (numScore >= 5) average++;
            else weak++;
        }
    });

    if (count === 0) return null;

    return {
        chartData: [
            { name: 'Giỏi (≥8)', value: excellent, color: '#4ade80', label: 'Giỏi' }, 
            { name: 'Khá (6.5-8)', value: good, color: '#60a5fa', label: 'Khá' },   
            { name: 'Trung bình (5-6.5)', value: average, color: '#facc15', label: 'Trung bình' },  
            { name: 'Yếu (<5)', value: weak, color: '#f87171', label: 'Yếu' },       
        ],
        avg: (totalScore / count).toFixed(2),
        max,
        min,
        gradedCount: count
    };
  }, [submissions]);

  const handleExportExcel = () => {
    // const studentToExport = [];
    // if (!allStudents || allStudents.length > 0) {
    //     studentToExport.push(allStudents);      
    // } else if (submissions && submissions.length > 0) {
    //   const uniqueStudents = [];
    //   submissions.forEach(sub => {
    //     if (sub.studentId) {
    //       const sid = sub.studentId?._id || sub.studentId;
    //       if (!uniqueStudents[sid]) {
    //         uniqueStudents[sid] = {
    //             _id: sid,
    //             name: sub.studentId.name || "Không tên",
    //             email: sub.studentId.email || "Không email",
    //             studentId: sub.studentId.studentId || "" // Mã HS nếu có
    //         };
    //       }
    //     }
    //   });
    //   studentToExport.push(Object.values(uniqueStudents));
    // }

    const assignmentTitle = assignmentInfo?.title || "Bài tập";
    const className = assignmentInfo?.classId?.name || "Lớp học";

    const worksheetData = [
      [`Bảng điểm môn ${assignmentTitle} - ${className}`],
      [`Giáo viên: ${teacherName}`],
      [`Tổng số học sinh: ${allStudents.length}`], 
      [""],
      ["STT", "Họ và tên", "Email/Mã HS", "Lớp", `Điểm ${assignmentTitle}`, "Trạng thái", "Điểm AI"]
    ];

    const submissionMap = {};
    submissions.forEach(sub => {
        const sId = sub.studentId?._id || sub.studentId; 
        submissionMap[sId] = sub;
    });

    allStudents.forEach((student, index) => {
      const studentId = student._id;
      const sub = submissionMap[studentId]; 

      let grade = 0;       
      let status = "Chưa nộp";
      let aiscore = 0;

      if (sub) {
        status = "Đã nộp";
        if (sub.grade !== null && sub.grade !== undefined) {
            grade = sub.grade; 
        } else {
            grade = "Chưa chấm"; 
        }
        if (sub.aiScore !== null && sub.aiScore !== undefined) {
            aiscore = sub.aiScore;
        }
      } 

      worksheetData.push([
        index + 1,
        student.name,
        student.email || student.studentId, 
        className,
        grade, 
        status, 
        aiscore
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, 
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    ];
    const headerStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: "center", vertical: "center" } };
    if (ws['A1']) ws['A1'].s = headerStyle;
    if (ws['A2']) ws['A2'].s = { ...headerStyle, font: { bold: false, sz: 12 } };
    ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 10}];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BangDiemChiTiet");
    XLSX.writeFile(wb, `BangDiem_${className}_Full.xlsx`);
  };

  const handleUploadZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("zipfile", file);
    formData.append("assignmentId", assignmentId);

    try {
      setUploading(true); 
      setGradingFinished(false);
      await axios.post("/api/submissions/upload-zip", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploading(false);
      setIsProcessing(true);
      alert("Upload thành công! Đang quét và tạo bài nộp...");
      fetchData(true);
    } catch (err) {
      console.error(err);
      setUploading(false);
      alert("Upload thất bại!");
    }
  };

  const getGradeColor = (grade) => {
    if (grade >= 8) return 'text-green-600'
    if (grade >= 6.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Đã chấm nếu có điểm giáo viên HOẶC điểm AI
  const isGraded = (sub) => {
    const hasTeacherGrade = sub.grade !== null && sub.grade !== undefined;
    const hasAiScore = sub.aiScore !== null && sub.aiScore !== undefined;
    return hasTeacherGrade || hasAiScore;
  };

if (loading) {
    return (
      <TeacherLayout>
        <div className="flexCenter h-[calc(100vh-80px)]">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-500 font-medium">Đang tải...</span>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      {/* POPUP & NOTIFICATIONS */}
      {uploading && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-slight">
                <div className="loading-spinner w-12 h-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                <h3 className="text-xl font-bold text-gray-800">Đang tải bài nộp lên...</h3>
                <p className="text-gray-500">Vui lòng không tắt trình duyệt.</p>
            </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl z-40 flex items-center gap-4 animate-slide-up">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <div>
                <p className="font-bold">AI đang chấm bài...</p>
                <p className="text-sm text-blue-100">Đã xong {submissions.filter(isGraded).length}/{submissions.length} bài</p>
            </div>
        </div>
      )}

      {gradingFinished && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-fade-in-down">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="font-bold">Đã chấm xong tất cả!</span>
        </div>
      )}

      <div className="w-full">
        {/* HEADER */}
        <div className="mb-8">
          <Link to={`/class/${assignmentInfo?.classId._id}`} className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-4 transition-colors text-sm font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Quay lại lớp học
          </Link>
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{assignmentInfo?.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
                   {submissions.length} bài nộp
                </span>
                <span>•</span>
                <span>Hạn nộp: {assignmentInfo?.deadline ? new Date(assignmentInfo.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <button
                onClick={handleExportExcel}
                className="flex-1 sm:flex-none justify-center bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 hover:text-green-600 hover:border-green-300 transition-all flex items-center gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Xuất Excel
              </button>
              <label className={`flex-1 sm:flex-none justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                {uploading ? 'Đang upload...' : 'Upload bài nộp (Zip)'}
                <input type="file" accept=".zip,.rar" className="hidden" onChange={handleUploadZip} disabled={uploading}/>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: SUBMISSION LIST */}
            <div className="xl:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {submissions.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Chưa có bài nộp nào</h3>
                      <p className="text-gray-500 mt-2">Upload file zip hoặc chờ học sinh nộp bài.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                    {submissions.map(sub => {
                        const graded = isGraded(sub);
                        const hasOfficialGrade = sub.grade !== null && sub.grade !== undefined;
                        const displayScore = hasOfficialGrade ? sub.grade : sub.aiScore;

                        return (
                        <div key={sub._id} className={`p-5 transition-all hover:bg-gray-50 ${isProcessing && !graded ? 'opacity-60 grayscale' : ''}`}>
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                {/* User Info */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                                        {sub.studentId?.name?.charAt(0)?.toUpperCase() || 'H'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{sub.studentId?.name}</h3>
                                        <p className="text-sm text-gray-500 mb-2">{sub.studentId?.email}</p>
                                        <p className="text-xs text-gray-400">Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}</p>
                                    </div>
                                </div>
                                
                                {/* Score & Status */}
                                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                                    {graded ? (
                                        <div className={`text-2xl font-bold flex items-center gap-2 ${hasOfficialGrade ? "text-green-600" : "text-blue-600"}`}>
                                            {displayScore}
                                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider border border-gray-200 px-2 py-0.5 rounded">
                                                {hasOfficialGrade ? "Chính thức" : "AI Gợi ý"}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-100">
                                            {isProcessing ? 'Đang chấm...' : 'Chưa chấm'}
                                        </span>
                                    )}
                                    
                                    <Link 
                                        to={`/assignment/${assignmentId}/submissions/${sub.studentId?._id}`}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline mt-1"
                                    >
                                        Xem chi tiết &rarr;
                                    </Link>
                                </div>
                            </div>

                            {/* Short Preview */}
                            {(sub.content || sub.feedback) && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                                    {sub.content && <p className="text-gray-600 line-clamp-2 mb-1"><span className="font-semibold text-gray-800">Bài làm:</span> {sub.content}</p>}
                                    {sub.feedback && <p className="text-blue-800 line-clamp-1"><span className="font-semibold">Nhận xét:</span> {sub.feedback}</p>}
                                </div>
                            )}
                        </div>
                        )
                    })}
                    </div>
                )}
                </div>
            </div>

            {/* RIGHT COLUMN: STATISTICS */}
            <div className="xl:col-span-1">
                {statistics ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            Phổ điểm lớp học
                        </h3>
                        
                        {/* CHART */}
                        <div className="h-56 w-full mb-6 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statistics.chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                                        {statistics.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-3xl font-bold text-gray-800">{statistics.avg}</span>
                                <span className="text-xs text-gray-500 font-medium uppercase">Trung bình</span>
                            </div>
                        </div>

                        {/* STATS TABLE */}
                        <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-700">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold">Xếp loại</th>
                                        <th className="px-3 py-2 text-center font-semibold">SL</th>
                                        <th className="px-3 py-2 text-right font-semibold">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {statistics.chartData.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-2 flex items-center gap-2 text-gray-600">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div>
                                                {item.label}
                                            </td>
                                            <td className="px-3 py-2 text-center font-bold text-gray-800">{item.value}</td>
                                            <td className="px-3 py-2 text-right text-gray-500">
                                                {((item.value / statistics.gradedCount) * 100).toFixed(0)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MIN/MAX CARDS */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                                <p className="text-xs text-green-600 font-bold uppercase mb-1">Cao nhất</p>
                                <p className="text-2xl font-bold text-green-700">{statistics.max}</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                                <p className="text-xs text-red-600 font-bold uppercase mb-1">Thấp nhất</p>
                                <p className="text-2xl font-bold text-red-700">{statistics.min}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center border-dashed">
                        <p className="text-gray-400 font-medium">Chưa có dữ liệu thống kê</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </TeacherLayout>
  )
}

export default Submissions