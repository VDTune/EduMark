import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'

const Profile = () => {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1) // Quay lại trang trước đó
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header với nút back */}
        <div className="mb-8">
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
          <p className="text-gray-600 mt-2">Thông tin tài khoản của bạn</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header với avatar */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.name || 'Chưa có tên'}</h2>
                <p className="text-blue-100 opacity-90">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Thông tin chi tiết */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                <p className="text-lg text-gray-900 font-semibold">{user?.name || 'Chưa cập nhật'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg text-gray-900 font-semibold">{user?.email}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Vai trò</label>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {user?.role || 'Học sinh'}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Số lớp học</label>
                <div className="flex items-center space-x-2">
                  <span className="text-lg text-gray-900 font-semibold">
                    {user?.classes?.length || 0}
                  </span>
                  <span className="text-gray-500">lớp</span>
                </div>
              </div>
            </div>

            {/* Thống kê nhanh (nếu có) */}
            {user?.classes && user.classes.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lớp học đang tham gia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {user.classes.slice(0, 6).map((classItem, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="font-medium text-gray-900">{classItem.name}</p>
                      <p className="text-sm text-gray-500">{classItem.subject}</p>
                    </div>
                  ))}
                </div>
                {user.classes.length > 6 && (
                  <p className="text-sm text-gray-500 mt-3">+{user.classes.length - 6} lớp khác</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile