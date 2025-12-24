import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ClassDetail from './pages/ClassDetail'
import AssignmentDetail from './pages/AssignmentDetail'
import MySubmissions from './pages/MySubmissions'
import Profile from './pages/Profile'
import PrivateRoute from './components/PrivateRoute'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/class/:classId" element={<PrivateRoute><ClassDetail /></PrivateRoute>} />
        <Route path="/assignment/:assignmentId" element={<PrivateRoute><AssignmentDetail /></PrivateRoute>} />
        <Route path="/my-submissions" element={<PrivateRoute><MySubmissions /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  )
}
export default App