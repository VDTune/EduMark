import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    if (!allStudents || allStudents.length === 0) {
      alert("Không tìm thấy danh sách học sinh để xuất!");
      return;
    }

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
      <div className="min-h-screen bg-gray-10 flexCenter">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-50">Đang tải...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-10">
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
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg z-40 flex items-center gap-3 animate-pulse">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-medium">AI đang chấm bài... ({submissions.filter(isGraded).length}/{submissions.length})</span>
        </div>
      )}

      {gradingFinished && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-bounce">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
                <h4 className="font-bold text-lg">Hoàn tất!</h4>
                <p className="text-sm">Đã chấm xong tất cả bài nộp.</p>
            </div>
        </div>
      )}

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
          <Link to={`/class/${assignmentInfo?.classId._id}`} className="flex items-center text-gray-50 hover:text-gray-90 mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại lớp học
          </Link>
          <div className="flexBetween">
            <div>
              <h1 className="h1 text-gray-90 mb-2">Bài nộp: {assignmentInfo?.title}</h1>
              <p className="regular-16 text-gray-50">
                {submissions.length} bài nộp • Hạn nộp: {assignmentInfo?.deadline ? new Date(assignmentInfo.deadline).toLocaleDateString('vi-VN') : 'Không có'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 hover:text-green-600 transition-all duration-200 flex items-center gap-2"
                title="Xuất bảng điểm ra file Excel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Xuất Bảng Điểm (Excel)
              </button>
            </div>
            <label
              className={`bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              title="Upload file nén (zip / rar) chứa bài nộp của học sinh"
            >
              {/* + Upload bài nộp học sinh */}
              {uploading ? 'Đang upload...' : '+ Upload bài nộp (Zip)'}
              <input 
                type="file" 
                accept=".zip,.rar" 
                className="hidden" 
                onChange={handleUploadZip}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* CỘT TRÁI: DANH SÁCH BÀI NỘP */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-gray-200">
                {submissions.length === 0 ? (
                    <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-90 mb-2">Chưa có bài nộp nào</h3>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                    {submissions.map(sub => {
                        const graded = isGraded(sub);
                        const hasOfficialGrade = sub.grade !== null && sub.grade !== undefined;
                        const displayScore = hasOfficialGrade ? sub.grade : sub.aiScore;

                        const itemClass = `p-6 transition-all duration-500 ${
                            isProcessing && !graded 
                            ? 'opacity-40 grayscale pointer-events-none bg-gray-50 relative overflow-hidden' 
                            : 'opacity-100 bg-white'
                        }`;

                        return (
                        <div key={sub._id} className={itemClass}>
                            {isProcessing && !graded && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="bg-white/80 px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs font-bold text-blue-600">Đang chấm...</span>
                                    </div>
                                </div>
                            )}

                            <div className="flexBetween mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flexCenter text-white font-medium">
                                {sub.studentId?.name?.charAt(0)?.toUpperCase() || 'H'}
                                </div>
                                <div>
                                <h3 className="font-semibold text-gray-90">{sub.studentId?.name}</h3>
                                <p className="text-sm text-gray-50">{sub.studentId?.email}</p>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                {graded ? (
                                <div className={`text-lg font-bold flex items-center justify-end gap-2 ${hasOfficialGrade ? "text-green-600" : "text-red-600"}`}>
                                    {isProcessing && <span className="text-green-500 animate-scale-in">✓</span>}
                                    {displayScore} {hasOfficialGrade ? "Điểm" : "Điểm đề xuất"}
                                </div>
                                ) : (
                                <span className="text-orange-600 font-medium italic">
                                    {isProcessing ? 'Đang đợi AI...' : 'Chưa chấm'}
                                </span>
                                )}
                                <p className="text-sm text-gray-50">
                                {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                                </p>
                            </div>
                            </div>

                            <div className="mb-4">
                            <p className="text-gray-90 mb-2">
                                <span className="font-medium">Nội dung:</span> {sub.content || 'Không có nội dung'}
                            </p>
                            
                            {/* --- ĐÃ XÓA PHẦN LINK TẢI FILE Ở ĐÂY THEO YÊU CẦU --- */}
                            
                            </div>

                            {sub.feedback && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-blue-900">
                                <span className="font-medium">Phản hồi:</span> {sub.feedback}
                                </p>
                            </div>
                            )}
                            <Link 
                            to={`/assignment/${assignmentId}/submissions/${sub.studentId?._id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                            Xem chi tiết →
                            </Link>
                        </div>
                        )
                    })}
                    </div>
                )}
                </div>
            </div>

            {/* CỘT PHẢI: BIỂU ĐỒ & BẢNG THỐNG KÊ */}
            <div className="lg:col-span-1">
                {statistics ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-gray-90 mb-4 text-center">Phổ điểm lớp học</h3>
                        
                        {/* 1. Biểu đồ tròn */}
                        <div className="h-64 w-full mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statistics.chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statistics.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 2. Bảng thống kê chi tiết (Yêu cầu mới) */}
                        <div className="overflow-hidden border border-gray-200 rounded-lg mb-6">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-2">Loại điểm</th>
                                        <th className="px-4 py-2 text-center">SL</th>
                                        <th className="px-4 py-2 text-right">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {statistics.chartData.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2 flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                                                {item.label}
                                            </td>
                                            <td className="px-4 py-2 text-center font-medium">{item.value}</td>
                                            <td className="px-4 py-2 text-right text-gray-500">
                                                {((item.value / statistics.gradedCount) * 100).toFixed(0)}%
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-bold text-gray-900">
                                        <td className="px-4 py-2">Tổng</td>
                                        <td className="px-4 py-2 text-center">{statistics.gradedCount}</td>
                                        <td className="px-4 py-2 text-right">100%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 3. Các chỉ số phụ */}
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-blue-600 text-sm font-medium">Điểm trung bình:</span>
                                <span className="font-bold text-blue-900 text-lg">{statistics.avg}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-green-50 rounded-lg text-center">
                                    <p className="text-xs text-green-600 mb-1 font-medium">Cao nhất</p>
                                    <p className="font-bold text-green-900">{statistics.max}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-lg text-center">
                                    <p className="text-xs text-red-600 mb-1 font-medium">Thấp nhất</p>
                                    <p className="font-bold text-red-900">{statistics.min}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
                        <p>Chưa có dữ liệu điểm số để thống kê</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}

export default Submissions