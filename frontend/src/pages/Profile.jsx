import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authAPI } from '../api/auth'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import MainLayout from '../components/layout/MainLayout'
import Loading from '../components/Loading'
import { FiEdit2, FiSave, FiX, FiLock, FiImage, FiCompass, FiShield } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

const Profile = () => {
  const { user, updateUser } = useAuthStore()

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState([])
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    avatar: null
  })

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
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
    if (files) {
      setFormData({ ...formData, [name]: files[0] })
      setRemoveAvatar(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewAvatar(reader.result)
      }
      reader.readAsDataURL(files[0])
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleRemoveAvatar = () => {
    setPreviewAvatar(null)
    setRemoveAvatar(true)
    setFormData({ ...formData, avatar: null })
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData({ ...passwordData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = new FormData()

      if (formData.first_name !== user.first_name) {
        submitData.append('first_name', formData.first_name)
      }
      if (formData.last_name !== user.last_name) {
        submitData.append('last_name', formData.last_name)
      }
      if (formData.bio !== user.bio) {
        submitData.append('bio', formData.bio || '')
      }
      if (formData.avatar) {
        submitData.append('avatar', formData.avatar)
      } else if (removeAvatar) {
        submitData.append('avatar', '')
      }

      const updatedUser = await authAPI.updateProfile(submitData)
      updateUser(updatedUser)
      setIsEditing(false)
      setFormData({ ...formData, avatar: null })
      setPreviewAvatar(null)
      setRemoveAvatar(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match')
      return
    }

    setLoading(true)

    try {
      await authAPI.changePassword(passwordData)
      toast.success('Password changed successfully!')
      setShowPasswordChange(false)
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.old_password?.[0] || error.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      bio: user.bio || '',
      avatar: null
    })
    setPreviewAvatar(null)
    setRemoveAvatar(false)
  }

  if (!user) return (
    <MainLayout>
      <Loading />
    </MainLayout>
  )

  return (
    <MainLayout showRightSidebar={false}>
      <div className="space-y-6">
        {/* Profile Header Card - Full Width Horizontal */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border border-blue-100 dark:border-gray-700">
          <div className="flex items-center space-x-8">
            {/* Avatar */}
            <div className="relative group">
              {(previewAvatar || user.avatar) && !removeAvatar ? (
                <img
                  src={previewAvatar || user.avatar}
                  alt={user.username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 dark:border-blue-400 shadow-lg transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-4 border-blue-500 dark:border-blue-400 shadow-lg">
                  <span className="text-white font-bold text-5xl">{user.username[0].toUpperCase()}</span>
                </div>
              )}
              {isEditing && (
                <>
                  <label className="absolute bottom-0 right-0 bg-blue-600 dark:bg-blue-500 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg transform transition-all duration-200 hover:scale-110">
                    <FiImage size={18} />
                    <input
                      type="file"
                      name="avatar"
                      accept="image/*"
                      onChange={handleChange}
                      className="hidden"
                    />
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                      <div className="bg-gray-800 dark:bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                        Change photo
                      </div>
                    </div>
                  </label>
                  {(user.avatar || previewAvatar) && !removeAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute top-0 right-0 bg-red-600 dark:bg-red-500 text-white p-2 rounded-full cursor-pointer hover:bg-red-700 dark:hover:bg-red-600 shadow-lg transform transition-all duration-200 hover:scale-110"
                      title="Remove photo"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {user.username}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                {user.email}
              </p>
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-semibold shadow-md">
                  <FiShield size={16} />
                  <span>{user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information and Change Password - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                <FiEdit2 className="mr-2 text-blue-600 dark:text-blue-400" size={24} />
                Profile Information
              </h3>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <FiEdit2 size={16} />
                  <span className="font-semibold">Edit</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 text-white rounded-lg hover:from-green-700 hover:to-green-800 dark:hover:from-green-600 dark:hover:to-green-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <FiSave size={16} />
                    <span className="font-semibold">{loading ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md transition-all duration-200"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              )}
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-600 dark:disabled:text-gray-400 transition-colors"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-600 dark:disabled:text-gray-400 transition-colors"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows="5"
                  className={`w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 resize-none transition-colors ${
                    !isEditing ? 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 italic' : ''
                  }`}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                <FiLock className="mr-2 text-blue-600 dark:text-blue-400" size={24} />
                Security
              </h3>

              {!showPasswordChange && (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <FiLock size={16} />
                  <span className="font-semibold">Change</span>
                </button>
              )}
            </div>

            {showPasswordChange ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="old_password"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                    placeholder="Current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                    placeholder="New password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    required
                    className={`w-full px-4 py-2.5 border-2 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg transition-colors ${
                      passwordData.confirm_password === ''
                        ? 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400'
                        : passwordData.new_password === passwordData.confirm_password
                          ? 'border-green-500 dark:border-green-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400'
                          : 'border-red-500 dark:border-red-400 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-400'
                    }`}
                    placeholder="Confirm password"
                  />
                  {passwordData.confirm_password !== '' && (
                    <p className={`text-sm mt-1 font-medium ${
                      passwordData.new_password === passwordData.confirm_password
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {passwordData.new_password === passwordData.confirm_password
                        ? '✓ Passwords match'
                        : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 disabled:opacity-50 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false)
                      setPasswordData({
                        old_password: '',
                        new_password: '',
                        confirm_password: ''
                      })
                    }}
                    className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-4">
                  <FiLock className="text-blue-600 dark:text-blue-400" size={36} />
                </div>
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password Protection
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Keep your account secure by updating your password regularly
                </p>
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm"
                >
                  Click here to change →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Subscriptions - Full Width */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
            <span className="mr-2">📚</span>
            My Subscriptions
            <span className="ml-2 text-lg text-gray-500 dark:text-gray-400">({subscriptions.length})</span>
          </h3>

          {subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-6">
                <FiCompass className="text-blue-600 dark:text-blue-400" size={48} />
              </div>
              <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No subscriptions yet
              </h4>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                Start following confessions to see their posts in your feed and stay updated with their content.
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold"
              >
                <FiCompass size={20} />
                <span>Explore Confessions</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map(sub => (
                <Link
                  key={sub.id}
                  to={`/confession/${sub.confession.slug}`}
                  className="flex items-center space-x-4 p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group bg-white dark:bg-gray-800/50"
                >
                  {sub.confession.logo ? (
                    <img
                      src={sub.confession.logo}
                      alt={sub.confession.name}
                      className="w-14 h-14 rounded-full object-cover shadow-md group-hover:scale-110 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                      <span className="text-white font-bold text-lg">{sub.confession.name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {sub.confession.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Subscribed {formatDistanceToNow(new Date(sub.subscribed_at), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default Profile
