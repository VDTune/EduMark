import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import AuthContext from '../context/AuthContext'
import Swal from 'sweetalert2'

const Dashboard = () => {
  const { user } = useContext(AuthContext) // Giữ logic, bỏ logout vì không dùng ở đây
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
        setError(err.response?.data?.message || err.message || 'Không thể tải danh sách lớp học')
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchClasses()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-10 pt-5 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lớp học của tôi</h1>
          <p className="text-gray-500">Danh sách các lớp học bạn đang tham gia</p>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </span>
            <button onClick={() => window.location.reload()} className="text-sm font-bold hover:underline">Thử lại</button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="text-gray-500 font-medium">Đang đồng bộ dữ liệu...</span>
          </div>
        ) : classes.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-300">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa tham gia lớp học nào</h3>
            <p className="text-gray-500 text-center max-w-sm">Liên hệ giáo viên của bạn để nhận mã lớp hoặc được thêm vào lớp học.</p>
          </div>
        ) : (
          /* CLASS GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map(cls => (
              <Link key={cls._id} to={`/class/${cls._id}`} className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col h-full">

                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl group-hover:scale-105 transition-transform border border-blue-100 shadow-sm">
                    {cls.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] uppercase font-bold rounded-full border border-green-100 tracking-wide">
                    Đang học
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1" title={cls.name}>
                  {cls.name}
                </h3>

                <p className="text-sm text-gray-500 mb-5 flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  GV: {cls.teacher?.name || 'Chưa cập nhật'}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium text-xs">
                    {cls.students?.length || 0} thành viên
                  </span>
                  <span className="text-blue-600 font-medium text-xs opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                    Truy cập →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard