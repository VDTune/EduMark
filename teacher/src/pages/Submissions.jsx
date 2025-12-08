import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import * as XLSX from 'xlsx'

const Submissions = () => {
  const { assignmentId } = useParams()
  const [submissions, setSubmissions] = useState([])
  const [assignmentInfo, setAssignmentInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allStudents, setAllStudents] = useState([])
  const [teacherName, setTeacherName] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Lấy thông tin bài tập
        const assignmentRes = await axios.get(`/api/assignments/${assignmentId}`)
        const assignmentData = assignmentRes.data.data
        setAssignmentInfo(assignmentData)
        
        // Lấy bài nộp
        const submissionsRes = await axios.get(`/api/submissions/assignment/${assignmentId}`)
        setSubmissions(submissionsRes.data.data || [])
        
        // Lấy danh sách tất cả học sinh trong lớp
        if (assignmentData && assignmentData.classId) {
            const classId = assignmentData.classId._id || assignmentData.classId;
            const classRes = await axios.get(`/api/classrooms/my`); 
            // Tìm đúng lớp đó
            const currentClass = classRes.data.data.find(c => c._id === classId)
            setAllStudents(currentClass?.students || []);
            console.log("Thông tin lớp học tìm thấy:", currentClass);
            setTeacherName(currentClass?.teacher?.name || '');
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        alert('Không thể tải thông tin bài nộp')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [assignmentId])

  // Xuat file excel
  const handleExportExcel = () => {
    if (!allStudents || allStudents.length === 0) {
      alert("Không tìm thấy danh sách học sinh để xuất!");
      return;
    }

    const assignmentTitle = assignmentInfo?.title || "Bài tập";
    const className = assignmentInfo?.classId?.name || "Lớp học";

    // Tạo Header
    const worksheetData = [
      [`Bảng điểm môn ${assignmentTitle} - ${className}`],
      [`Giáo viên: ${teacherName}`],
      [`Tổng số học sinh: ${allStudents.length}`], // Đếm tổng học sinh
      [""],
      ["STT", "Họ và tên", "Email/Mã HS", "Lớp", `Điểm ${assignmentTitle}`, "Trạng thái"]
    ];

    // Tạo Map (từ điển) cho các bài nộp để tra cứu nhanh hơn
    // Key là studentId, Value là object bài nộp
    const submissionMap = {};
    submissions.forEach(sub => {
        // Lưu ý: kiểm tra xem sub.studentId là object hay string id
        const sId = sub.studentId?._id || sub.studentId; 
        submissionMap[sId] = sub;
    });

    // DUYỆT QUA DANH SÁCH TẤT CẢ HỌC SINH (allStudents)
    allStudents.forEach((student, index) => {
      const studentId = student._id;
      const sub = submissionMap[studentId]; // Tìm bài nộp của học sinh này

      let grade = 0;       // Mặc định là 0 điểm
      let status = "Chưa nộp";

      if (sub) {
        // Nếu ĐÃ NỘP bài
        status = "Đã nộp";
        if (sub.grade !== null && sub.grade !== undefined) {
            grade = sub.grade; // Lấy điểm thật nếu đã chấm
        } else {
            grade = "Chưa chấm"; // Đã nộp nhưng giáo viên chưa chấm
        }
      } 
      // Nếu sub === undefined thì giữ nguyên grade = 0, status = "Chưa nộp"

      worksheetData.push([
        index + 1,
        student.name,
        student.email || student.studentId, // Thêm email hoặc mã HS để dễ nhận diện
        className,
        grade, // Điểm (0 hoặc điểm thật)
        status // Trạng thái để giáo viên dễ nhìn
      ]);
    });

    // Tạo Sheet và File (như cũ)
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Merge Header
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, 
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ];
    
    // Thêm style alignment và font-weight cho header
    const headerStyle = { 
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "center", vertical: "center" } 
    };
    if (ws['A1']) ws['A1'].s = headerStyle;
    if (ws['A2']) ws['A2'].s = { ...headerStyle, font: { bold: false, sz: 12 } };

    // Chỉnh độ rộng cột
    ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];

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
      const res = await axios.post("/api/submissions/upload-zip", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Upload thành công! Đang quét và tạo bài nộp...");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Upload thất bại!");
    }
  };


  const getGradeColor = (grade) => {
    if (grade >= 8) return 'text-green-600'
    if (grade >= 6.5) return 'text-yellow-600'
    return 'text-red-600'
  }

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
      {/* Navigation */}
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
        {/* Header */}
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
              // to={`/class/${classId}/create-assignment`}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200"
              title="Upload file nén (zip / rar) chứa bài nộp của học sinh"
            >
              + Upload bài nộp học sinh
              <input 
                type="file" 
                accept=".zip,.rar" 
                className="hidden" 
                onChange={handleUploadZip}
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-90 mb-2">Chưa có bài nộp nào</h3>
              {/* <p className="text-gray-50">Học sinh chưa nộp bài cho bài tập này</p> */}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {submissions.map(sub => (
                <div key={sub._id} className="p-6">
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
                      {sub.grade !== undefined && sub.grade !== null ? (
                        <div className={`text-lg font-bold ${getGradeColor(sub.grade)}`}>
                          {sub.grade} Điểm
                        </div>
                      ) : (
                        <span className="text-orange-600 font-medium">Chưa chấm</span>
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
                    {sub.fileUrl && (
                      <a 
                        href={`http://localhost:5000${sub.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Tải file bài nộp
                      </a>
                    )}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Submissions