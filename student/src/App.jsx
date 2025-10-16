import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ClassDetail from './pages/ClassDetail'
import AssignmentDetail from './pages/AssignmentDetail'
import Profile from './pages/Profile'
import MySubmissions from './pages/MySubmissions'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/class/:classId" element={<PrivateRoute><ClassDetail /></PrivateRoute>} />
        <Route path="/assignment/:assignmentId" element={<PrivateRoute><AssignmentDetail /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/submissions" element={<PrivateRoute><MySubmissions /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  )
}

export default App