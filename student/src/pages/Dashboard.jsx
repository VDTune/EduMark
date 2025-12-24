import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import AuthContext from '../context/AuthContext'
import Swal from 'sweetalert2'

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext)
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Fetching classrooms for user:', user)
        const res = await axios.get('/api/classrooms/my')
        console.log('Classrooms response:', res.data)
        
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

    if (user) {
      fetchClasses()
    }
  }, [user])

  const handleLogout = () => {
      Swal.fire({
        title: 'Đăng xuất?',
        text: "Bạn có chắc chắn muốn thoát phiên làm việc?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6', // Màu xanh (giống theme của bạn)
        cancelButtonColor: '#ef4444',  // Màu đỏ
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy',
        background: '#fff',
        customClass: {
          popup: 'rounded-xl', // Bo tròn góc popup cho đẹp
          title: 'text-xl font-bold text-gray-800',
          content: 'text-gray-600'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          logout() // Gọi hàm logout từ context
          
          // Tùy chọn: Hiển thị thông báo nhỏ trước khi chuyển trang
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
          })
          Toast.fire({
            icon: 'success',
            title: 'Đã đăng xuất thành công'
          })
        }
      })
    }

  return (
    <div className="min-h-screen bg-gray-10">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-padd-container">
          <div className="flexBetween py-4">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flexCenter">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="bold-20 text-gray-90">Azota Classroom</span>
              </Link>
              <div className="flex items-center gap-6 medium-15 text-gray-50">
                <Link to="/" className="text-blue-600 medium-16">Lớp học</Link>
                <Link to="/submissions" className="hover:text-blue-600 transition-colors">Bài nộp của tôi</Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                to="/profile" 
                className="flex items-center gap-3 rounded-lg p-2 transition-all duration-200 hover:bg-gray-50/50 group"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flexCenter text-white medium-14 transition-transform group-hover:scale-105">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="medium-14 text-gray-90 group-hover:text-blue-600 transition-colors">{user?.name}</span>
                  <span className="regular-12 text-gray-50 capitalize">{user?.role}</span>
                </div>
              </Link>
              <div className="w-px h-6 bg-gray-200"></div>
              <button 
                onClick={handleLogout}
                className="medium-14 text-gray-50 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50/50"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-padd-container py-8">
        <div className="mb-8">
          <h1 className="h1 text-gray-90 mb-3">Lớp học của tôi</h1>
          <p className="regular-16 text-gray-50">
            {user?.role === 'teacher' 
              ? 'Quản lý các lớp học bạn đã tạo' 
              : 'Theo dõi các lớp học bạn đang tham gia'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {loading ? (
          <div className="flexCenter py-12">
            <div className="loading-spinner"></div>
            <span className="ml-3 text-gray-50">Đang tải lớp học...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="flexCenter flex-col py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-20 h-20 bg-gray-10 rounded-full flexCenter mb-4">
              <svg className="w-8 h-8 text-gray-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="medium-20 text-gray-90 mb-2">
              {user?.role === 'teacher' ? 'Chưa có lớp học nào' : 'Chưa tham gia lớp học nào'}
            </h3>
            <p className="regular-15 text-gray-50 text-center max-w-md">
              {user?.role === 'teacher' 
                ? 'Hãy tạo lớp học đầu tiên để bắt đầu quản lý học sinh và bài tập.'
                : 'Hãy liên hệ giáo viên để được thêm vào lớp học.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(cls => (
              <Link 
                key={cls._id} 
                to={`/class/${cls._id}`}
                className="block bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-blue-200 group"
              >
                <div className="p-6">
                  <div className="flexBetween mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flexCenter">
                      <span className="text-white medium-16">
                        {cls.name?.charAt(0)?.toUpperCase() || 'L'}
                      </span>
                    </div>
                    <span className="bg-green-100 text-green-800 medium-12 px-2 py-1 rounded-full">
                      Đang hoạt động
                    </span>
                  </div>
                  
                  <h3 className="medium-18 text-gray-90 mb-2 group-hover:text-blue-600 transition-colors truncate">
                    {cls.name}
                  </h3>
                  
                  <p className="regular-14 text-gray-50 mb-1">
                    <span className="medium-14">Giáo viên:</span>{' '}
                    {cls.teacher?.name || 'Chưa có thông tin'}
                  </p>
                  
                  <p className="regular-12 text-gray-30 mb-3">
                    Mã lớp: {cls._id?.substring(0, 8)}...
                  </p>

                  {cls.students && (
                    <p className="regular-12 text-gray-30">
                      Số học sinh: {cls.students.length}
                    </p>
                  )}
                  
                  <div className="flexBetween mt-4 pt-4 border-t border-gray-200">
                    <span className="flex items-center gap-1 regular-12 text-gray-30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cập nhật gần đây
                    </span>
                    <div className="text-blue-600 medium-14 group-hover:translate-x-1 transition-transform">
                      Vào lớp →
                    </div>
                  </div>
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