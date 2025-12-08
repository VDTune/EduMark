import { useContext } from 'react'
import { Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'

const Profile = () => {
  const { user, logout } = useContext(AuthContext)

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      logout()
    }
  }

  // Lấy chữ cái đầu tiên
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    // SỬA: Dùng bg-gray-10 thay vì bg-gray-50 để khớp với theme của bạn
    <div className="min-h-screen bg-gray-10">
      
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 w-full z-50">
        <div className="max-padd-container">
          <div className="flexBetween py-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flexCenter transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="bold-20 text-gray-90">Azota Classroom</span>
            </Link>
            <Link to="/" className="text-gray-50 hover:text-gray-90 medium-15 transition-colors flex items-center gap-1">
              <span>&larr;</span> Quay lại trang chủ
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-padd-container py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          
          {/* Banner Header */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>

          {/* Profile Content */}
          <div className="px-8 pb-8">
            
            {/* Avatar Section */}
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-lg">
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flexCenter text-white text-5xl font-bold shadow-inner">
                    {initial}
                  </div>
                </div>
                {/* Status Dot */}
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
              </div>
              
              <div className="mb-2 hidden sm:block">
                {/* SỬA: Thay đổi màu nền badge để tránh lỗi màu tối */}
                 <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide border ${
                    user?.role === 'teacher' 
                      ? 'bg-blue-100 text-blue-700 border-blue-200' 
                      : 'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {user?.role === 'teacher' ? 'GIÁO VIÊN' : 'HỌC SINH'}
                 </span>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-8">
              <h1 className="bold-32 text-gray-90 mb-1">{user?.name}</h1>
              <p className="text-gray-50 medium-16 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user?.email}
              </p>
            </div>

            <hr className="border-gray-200 my-8" />

            {/* Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card Thống kê */}
              {/* SỬA: Dùng bg-gray-10 thay vì gray-50 cho các card con */}
              <div className="p-5 bg-gray-10 rounded-xl border border-gray-200 hover:border-blue-400 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flexCenter group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-50 font-medium">Lớp học tham gia</p>
                    <p className="bold-24 text-gray-90">{user?.classes?.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Card Thời gian */}
              <div className="p-5 bg-gray-10 rounded-xl border border-gray-200 hover:border-purple-400 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flexCenter group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-50 font-medium">Ngày tham gia</p>
                    <p className="medium-18 text-gray-90">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Mới đây'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex justify-center md:justify-end gap-4">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 font-medium transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile