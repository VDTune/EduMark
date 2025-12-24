import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post(`/api/users/reset-password/${token}`, { password })
      if (res.data.success) {
        alert('Đổi mật khẩu thành công!')
        navigate('/login')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi đặt lại mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-10 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h2 className="h2 text-center mb-6">Đặt lại mật khẩu</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Mật khẩu mới (>= 8 ký tự)" required />
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg disabled:opacity-50">{loading ? 'Đang xử lý...' : 'Xác nhận'}</button>
        </form>
      </div>
    </div>
  )
}
export default ResetPassword