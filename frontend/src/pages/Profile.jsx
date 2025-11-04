import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { authAPI } from '../api/auth'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import Loading from '../components/Loading'
import { FiEdit2, FiSave, FiX } from 'react-icons/fi'

const Profile = () => {
  const { user, updateUser } = useAuthStore()

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState([])

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    avatar: null
  })

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const data = await confessionAPI.getSubscriptions()
      setSubscriptions(data.results || data)
    } catch (error) {
      console.error('Failed to fetch subscriptions')
    }
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = new FormData()
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== user?.[key]) {
          submitData.append(key, formData[key])
        }
      })

      const updatedUser = await authAPI.updateProfile(submitData)
      updateUser(updatedUser)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <Loading />

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <img
                  src={user.avatar || 'https://via.placeholder.com/150'}
                  alt={user.username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 mx-auto"
                />
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                    <FiEdit2 size={16} />
                    <input
                      type="file"
                      name="avatar"
                      accept="image/*"
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {user.username}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {user.email}
              </p>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Profile Information</h3>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiEdit2 size={16} />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <FiSave size={16} />
                    <span>{loading ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        bio: user.bio || '',
                        avatar: null
                      })
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <FiX size={16} />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </form>
          </div>

          {/* Subscriptions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              My Subscriptions ({subscriptions.length})
            </h3>

            {subscriptions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                You haven't subscribed to any confessions yet
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptions.map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    {sub.confession.logo && (
                      <img
                        src={sub.confession.logo}
                        alt={sub.confession.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {sub.confession.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Subscribed {formatDistanceToNow(new Date(sub.subscribed_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile