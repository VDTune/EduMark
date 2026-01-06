import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import TeacherLayout from '../layouts/TeacherLayout'

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
    <TeacherLayout>
      <div className="min-h-[80vh] flex flex-col justify-center"> {/* Căn giữa theo chiều dọc */}
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8 text-center sm:text-left">
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo lớp học mới</h1>
            <p className="text-gray-500">Thêm lớp học để bắt đầu quản lý học sinh và bài tập</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm">
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
                  placeholder="Nhập tên lớp học (Ví dụ: 10A1)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
    </TeacherLayout>
  )
}

export default CreateClass