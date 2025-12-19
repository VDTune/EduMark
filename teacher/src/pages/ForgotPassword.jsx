import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('/api/users/forgot-password', { email })
      if (res.data.success) setMessage('✅ Đã gửi link đặt lại mật khẩu vào email.')
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi gửi yêu cầu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-10 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="h2 text-center mb-4">Quên mật khẩu</h2>
        {message ? <div className="bg-green-50 text-green-700 p-4 rounded mb-6 text-center">{message}</div> : 
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Email của bạn" required />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Đang gửi...' : 'Gửi link'}</button>
          </form>
        }
        <div className="mt-6 text-center"><Link to="/login" className="text-blue-600">Quay lại đăng nhập</Link></div>
      </div>
    </div>
  )
}
export default ForgotPassword