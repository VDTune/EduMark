import { useContext } from 'react'
import AuthContext from '../context/AuthContext'

const Profile = () => {
  const { user } = useContext(AuthContext)

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl mb-6">Hồ sơ cá nhân</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p><strong>Tên:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Vai trò:</strong> {user?.role}</p>
        <p><strong>Lớp học:</strong> {user?.classes?.length || 0} lớp</p>
      </div>
    </div>
  )
}

export default Profile