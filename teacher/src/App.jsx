import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateClass from './pages/CreateClass'
import ClassDetail from './pages/ClassDetail'
import CreateAssignment from './pages/CreateAssignment'
import Submissions from './pages/Submissions'
import SubmissionDetail from './pages/SubmissionDetail'
import Profile from './pages/Profile'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/create-class" element={<PrivateRoute><CreateClass /></PrivateRoute>} />
        <Route path="/class/:classId" element={<PrivateRoute><ClassDetail /></PrivateRoute>} />
        <Route path="/class/:classId/create-assignment" element={<PrivateRoute><CreateAssignment /></PrivateRoute>} />
        <Route path="/assignment/:assignmentId/submissions" element={<PrivateRoute><Submissions /></PrivateRoute>} />
        <Route path="/assignment/:assignmentId/submissions/:studentId" element={<PrivateRoute><SubmissionDetail /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  )
}

export default App