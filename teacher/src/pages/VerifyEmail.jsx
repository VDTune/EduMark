import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

const VerifyEmail = () => {
  const { token } = useParams()
  const [status, setStatus] = useState('verifying')

  useEffect(() => {
    axios.get(`/api/users/verify/${token}`).then(() => setStatus('success')).catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-gray-10 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl p-8 text-center shadow-lg">
        {status === 'verifying' && <h2>Đang xác thực...</h2>}
        {status === 'success' && <div><h2 className="text-green-600 font-bold mb-4">Xác thực thành công!</h2><Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded">Đăng nhập</Link></div>}
        {status === 'error' && <div><h2 className="text-red-600 font-bold mb-4">Xác thực thất bại</h2><Link to="/login" className="text-blue-600">Về trang đăng nhập</Link></div>}
      </div>
    </div>
  )
}
export default VerifyEmail