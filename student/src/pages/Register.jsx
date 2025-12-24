import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'

const Register = () => {
  const { register } = useContext(AuthContext)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')
    try {
      // Hàm register trong AuthContext chỉ gọi API, không redirect
      const res = await register(name, email, password, role)
      if (res.success) {
        setSuccessMsg(`Đăng ký thành công! Vui lòng kiểm tra email ${email} để kích hoạt tài khoản.`)
        setName(''); setEmail(''); setPassword('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-10 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        {successMsg ? (
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-bold mb-2">Thành công!</h2>
            <p className="text-gray-600 mb-6">{successMsg}</p>
            <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Về trang Đăng nhập</Link>
          </div>
        ) : (
          <>
            <h1 className="h2 text-center mb-6">Đăng ký</h1>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex gap-4 mb-4">
                <label className={`flex-1 p-3 rounded-lg border cursor-pointer text-center transition-all ${role === 'student' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200'}`}>
                  <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} className="hidden" /> Học sinh
                </label>
                <label className={`flex-1 p-3 rounded-lg border cursor-pointer text-center transition-all ${role === 'teacher' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200'}`}>
                  <input type="radio" name="role" value="teacher" checked={role === 'teacher'} onChange={() => setRole('teacher')} className="hidden" /> Giáo viên
                </label>
              </div>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Họ tên" className="w-full p-3 border rounded-lg" required />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 border rounded-lg" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" className="w-full p-3 border rounded-lg" required />
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </button>
            </form>
            <div className="mt-6 text-center"><p>Đã có tài khoản? <Link to="/login" className="text-blue-600 font-bold">Đăng nhập</Link></p></div>
          </>
        )}
      </div>
    </div>
  )
}
export default Register