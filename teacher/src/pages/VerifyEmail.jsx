import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

const VerifyEmail = () => {
  const { token } = useParams()
  const [status, setStatus] = useState('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if(!token) return;
    axios.get(`/api/users/verify/${token}`)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.response?.data?.message || 'Link không hợp lệ')
      })
  }, [token])

  return (
    <div className="min-h-screen bg-gray-10 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl p-8 text-center shadow-lg">
        {status === 'verifying' && <div><div className="loading-spinner mx-auto mb-4"></div><h2>Đang xác thực...</h2></div>}
        {status === 'success' && <div><div className="text-green-500 text-5xl mb-4">✓</div><h2 className="text-2xl font-bold mb-2">Thành công!</h2><Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Đăng nhập ngay</Link></div>}
        {status === 'error' && <div><div className="text-red-500 text-5xl mb-4">✕</div><h2 className="text-2xl font-bold mb-2">Thất bại</h2><p className="text-red-600 mb-4">{errorMsg}</p><Link to="/login" className="text-blue-600 underline">Về trang đăng nhập</Link></div>}
      </div>
    </div>
  )
}
export default VerifyEmail