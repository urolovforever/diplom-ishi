import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authAPI } from '../api/auth'
import MainLayout from '../components/layout/MainLayout'
import Loading from '../components/Loading'
import { FiArrowLeft, FiMail, FiUser } from 'react-icons/fi'

const UserProfile = () => {
  const { username } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [username])

  const fetchUser = async () => {
    setLoading(true)
    try {
      const userData = await authAPI.getUserProfile(username)
      setUser(userData)
    } catch (error) {
      toast.error('Failed to load user profile')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <MainLayout>
      <Loading />
    </MainLayout>
  )

  if (!user) return (
    <MainLayout>
      <div className="text-center py-12">User not found</div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <FiArrowLeft />
          <span>Back to Home</span>
        </Link>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header with Avatar */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex flex-col items-center -mt-16">
              {/* Avatar */}
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-4xl">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="mt-6 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {user.username}
                </h1>
                <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
                  <FiMail size={18} />
                  <span>{user.email}</span>
                </div>
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full">
                  <FiUser size={16} />
                  <span className="font-medium capitalize">{user.role}</span>
                </div>
              </div>

              {/* Bio Section */}
              {user.bio && (
                <div className="mt-6 w-full max-w-2xl">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Bio</h3>
                    <p className="text-gray-600 leading-relaxed">{user.bio}</p>
                  </div>
                </div>
              )}

              {/* Stats Section */}
              <div className="mt-8 w-full max-w-2xl">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Profile Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Username</p>
                      <p className="font-medium text-gray-800">{user.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-medium text-gray-800">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Role</p>
                      <p className="font-medium text-gray-800 capitalize">{user.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Member since</p>
                      <p className="font-medium text-gray-800">
                        {new Date(user.date_joined).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default UserProfile
