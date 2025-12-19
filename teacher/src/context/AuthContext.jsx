import { createContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const AuthContext = createContext()
const STUDENT_APP_URL = 'http://localhost:5173' // Cổng của Student App

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios.get('/api/users/profile').then(res => {
          if (res.data.data.role === 'student') {
             // Nếu là Student mà lỡ vào đây
             window.location.href = STUDENT_APP_URL
          } else {
             setUser(res.data.data)
             setLoading(false)
          }
        }).catch(() => { localStorage.removeItem('token'); setLoading(false) })
    } else { setLoading(false) }
  }, [])

  const login = async (email, password, role) => {
    const res = await axios.post('/api/users/login', { email, password, role })
    const userData = res.data.data
    localStorage.setItem('token', res.data.token)

    if (userData.role === 'student') {
      alert('Đang chuyển hướng sang trang Học sinh...');
      window.location.href = STUDENT_APP_URL
    } else {
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      setUser(userData)
      navigate('/')
    }
  }

  const register = async (name, email, password, role) => {
    const res = await axios.post('/api/users/register', { name, email, password, role })
    if (res.data.token) {
       localStorage.setItem('token', res.data.token)
       axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
       setUser(res.data.data)
       navigate('/')
    } else {
       alert(res.data.message)
    }
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