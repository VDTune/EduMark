import { useContext } from 'react'
import { Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import Swal from 'sweetalert2'
import TeacherLayout from '../layouts/TeacherLayout' // Import Layout

const Profile = () => {
  const { user, logout } = useContext(AuthContext)

  const handleLogout = () => {
    Swal.fire({
      title: 'Đăng xuất?',
      text: "Bạn có chắc chắn muốn thoát phiên làm việc?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        logout()
        Swal.fire('Đã đăng xuất!', 'Hẹn gặp lại bạn.', 'success')
      }
    })
  }

  // Lấy chữ cái đầu tiên
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <TeacherLayout>
      <div className="w-full max-w-3xl mx-auto">
        
        {/* NÚT BACK TO HOME */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium text-sm group"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-2 group-hover:border-blue-300 group-hover:bg-blue-50 transition-all">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </div>
            Quay lại trang chủ
          </Link>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          
          {/* Banner Header */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>

          {/* Profile Content */}
          <div className="px-6 sm:px-8 pb-8">
            
            {/* Avatar Section */}
            <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-end -mt-12 mb-6 gap-4">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full p-1.5 shadow-lg mx-auto sm:mx-0">
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-inner">
                    {initial}
                  </div>
                </div>
                {/* Status Dot */}
                <div className="absolute bottom-2 right-1/2 translate-x-10 sm:translate-x-0 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 border-4 border-white rounded-full"></div>
              </div>
              
              <div className="text-center sm:text-right mb-2">
                 <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wide border ${
                    user?.role === 'teacher' 
                      ? 'bg-blue-100 text-blue-700 border-blue-200' 
                      : 'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {user?.role === 'teacher' ? 'GIÁO VIÊN' : 'HỌC SINH'}
                 </span>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-8 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{user?.name}</h1>
              <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user?.email}
              </p>
            </div>

            <hr className="border-gray-100 my-8" />

            {/* Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card Thống kê */}
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Lớp học tham gia</p>
                    <p className="text-2xl font-bold text-gray-900">{user?.classes?.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Card Thời gian */}
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Ngày tham gia</p>
                    <p className="text-lg font-bold text-gray-900">
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 font-medium transition-all duration-200 shadow-sm"
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
    </TeacherLayout>
  )
}

export default Profile