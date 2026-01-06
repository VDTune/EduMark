import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import AuthContext from '../context/AuthContext'
import TeacherLayout from '../layouts/TeacherLayout'

const Dashboard = () => {
  const { user } = useContext(AuthContext)
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await axios.get('/api/classrooms/my')
        if (res.data.success) {
          setClasses(res.data.data || [])
        } else {
          throw new Error(res.data.message || 'Failed to load classrooms')
        }
      } catch (err) {
        console.error('Error fetching classrooms:', err)
        setError(err.response?.data?.message || err.message || 'Không thể tải danh sách lớp học')
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchClasses()
  }, [user])

  return (
    <TeacherLayout>
      <div className="min-h-full bg-gray-10"> {/* Bỏ bg-gray-10, để mặc định trắng hoặc xám nhạt từ Layout */}
        {/* HEADER */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Lớp học của tôi</h1>
            <p className="text-gray-500 text-sm sm:text-base">Quản lý và theo dõi tiến độ các lớp học</p>
          </div>
          <Link
            to="/create-class"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tạo lớp mới
          </Link>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm">{error}</span>
            </div>
            <button onClick={() => window.location.reload()} className="text-sm underline hover:text-red-900 whitespace-nowrap">Thử lại</button>
          </div>
        )}

        {/* CONTENT GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="mt-4 text-gray-500 font-medium">Đang tải dữ liệu...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-white rounded-2xl border border-gray-200 shadow-sm border-dashed">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Chưa có lớp học nào</h3>
            <p className="text-gray-500 text-center max-w-md mb-8 px-4">Hãy tạo lớp học đầu tiên để bắt đầu hành trình giảng dạy của bạn.</p>
            <Link to="/create-class" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-1">
              Bắt đầu ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Link key={cls._id} to={`/class/${cls._id}`} className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl group-hover:scale-110 transition-transform">
                    {cls.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                    Hoạt động
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{cls.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-1">GV: {cls.teacher?.name}</p>
                
                <div className="mt-auto flex items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    {cls.students?.length || 0} Học sinh
                  </div>
                  <div className="ml-auto text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                    Truy cập &rarr;
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}
export default Dashboard