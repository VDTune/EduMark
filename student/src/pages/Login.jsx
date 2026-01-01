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
    setLoading(true)
    try {
      await login(email, password, role)
    } catch (err) {
      alert(err.response?.data?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-10 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <h1 className="h2 text-center mb-6">Đăng nhập</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-4 mb-4">
            <label className={`flex-1 p-3 rounded-lg border cursor-pointer text-center transition-all ${role === 'student' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200'}`}>
              <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} className="hidden" /> Học sinh
            </label>
            <label className={`flex-1 p-3 rounded-lg border cursor-pointer text-center transition-all ${role === 'teacher' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200'}`}>
              <input type="radio" name="role" value="teacher" checked={role === 'teacher'} onChange={() => setRole('teacher')} className="hidden" /> Giáo viên
            </label>
          </div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 border rounded-lg" required />
          <div>
            <div className="flex justify-between mb-1"><label className="text-sm">Mật khẩu</label><Link to="/forgot-password" className="text-sm text-blue-600">Quên mật khẩu?</Link></div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" className="w-full p-3 border rounded-lg" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
        <div className="mt-6 text-center"><p>Chưa có tài khoản? <Link to="/register" className="text-blue-600 font-bold">Đăng ký</Link></p></div>
      </div>
    </div>
  )
}
export default Login