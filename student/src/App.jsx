import { Routes, Route } from 'react-router-dom'
import { useContext } from 'react'

import { AuthProvider } from './context/AuthContext'
import AuthContext from './context/AuthContext'

import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'

import Dashboard from './pages/Dashboard'
import ClassDetail from './pages/ClassDetail'
import AssignmentDetail from './pages/AssignmentDetail'
import MySubmissions from './pages/MySubmissions'
import Profile from './pages/Profile'

/**
 * AppContent tách riêng để dùng AuthContext
 * Tránh lỗi redirect sai & loop
 */
const AppContent = () => {
  const { user, loading } = useContext(AuthContext)

  // Chờ xác thực token xong
  if (loading) return null

  return (
    <>
      {/* Navbar chỉ hiển thị khi đã login */}
      {user && <Navbar />}

      {/* Nếu có navbar thì chừa khoảng trống */}
      <div className={user ? 'pt-16' : ''}>
        <Routes>

          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          {/* ===== PRIVATE ROUTES ===== */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/class/:classId"
            element={
              <PrivateRoute>
                <ClassDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/assignment/:assignmentId"
            element={
              <PrivateRoute>
                <AssignmentDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/submissions"
            element={
              <PrivateRoute>
                <MySubmissions />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
