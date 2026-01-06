import { createContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const AuthContext = createContext()
// URL của Teacher App
const TEACHER_APP_URL = 'http://localhost:5174'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      axios.get('/api/users/profile')
        .then(res => {
          const userData = res.data.data

          // LOGIC CHẶN VÒNG LẶP:
          // Nếu là teacher -> Đẩy sang trang Teacher
          if (userData.role === 'teacher') {
            // Xóa token ở trang Student để tránh xung đột lần sau
            localStorage.removeItem('token')
            window.location.href = TEACHER_APP_URL
          } else {
            // Nếu là student -> Đúng nơi -> Set user
            setUser(userData)
            setLoading(false)
          }
        })
        .catch((err) => {
          console.error("Profile fetch error:", err)
          localStorage.removeItem('token')
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password, role) => {
    const res = await axios.post('/api/users/login', { email, password, role })
    const userData = res.data.data
    const token = res.data.token

    if (userData.role === 'teacher') {
      alert('Tài khoản này là Giáo viên. Đang chuyển sang trang Giáo viên...')
      // Không lưu token ở đây để tránh loop
      window.location.href = TEACHER_APP_URL
    } else {
      // Chỉ lưu token nếu đúng là Student
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
      navigate('/')
    }
  }

  // ... (giữ nguyên phần register và logout) ...
  const register = async (name, email, password, role) => {
    const res = await axios.post('/api/users/register', { name, email, password, role })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
export default AuthContext