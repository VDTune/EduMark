import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'

const Login = () => {
  const { login } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student') 
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await login(email, password, role)
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-10 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flexCenter">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-bold text-gray-90">EduMark</span>
          </Link>
          <h1 className="h2 text-gray-90 mb-3">Đăng nhập</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4 mb-4">
              <label className={`flex-1 p-3 rounded-lg border cursor-pointer text-center transition-all ${role === 'student' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 text-gray-600'}`}>
                <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} className="hidden" />
                Học sinh
              </label>
              <label className={`flex-1 p-3 rounded-lg border cursor-pointer text-center transition-all ${role === 'teacher' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 text-gray-600'}`}>
                <input type="radio" name="role" value="teacher" checked={role === 'teacher'} onChange={() => setRole('teacher')} className="hidden" />
                Giáo viên
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" required />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <Link to="/forgot-password" class="text-sm text-blue-600 hover:underline">Quên mật khẩu?</Link>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" required />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-50">Chưa có tài khoản? <Link to="/register" className="text-blue-600 font-medium">Đăng ký ngay</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Login