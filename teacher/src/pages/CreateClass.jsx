import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const CreateClass = () => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await axios.post('/api/classrooms', { name })
      alert('Tạo lớp thành công!')
      navigate('/')
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo lớp')
    } finally {
      setLoading(false)
    }
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
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <Link to="/" className="flex items-center text-gray-50 hover:text-gray-90 mb-4 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại
            </Link>
            <h1 className="h2 text-gray-90 mb-3">Tạo lớp học mới</h1>
            <p className="regular-16 text-gray-50">Thêm lớp học để bắt đầu quản lý học sinh và bài tập</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Tên lớp học
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên lớp học"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang tạo...
                  </div>
                ) : (
                  'Tạo lớp học'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateClass