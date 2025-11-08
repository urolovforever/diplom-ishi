import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { confessionAPI } from '../api/confession'
import { authAPI } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { useLanguage } from '../contexts/LanguageContext'
import { FiPlus, FiImage, FiVideo, FiUsers, FiSettings, FiArrowLeft } from 'react-icons/fi'

// Component for regular admin - post creation
const AdminPostCreation = ({ user }) => {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    confession: '',
    title: '',
    content: '',
    image: null,
    video_url: '',
    is_pinned: false
  })
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target

    if (name === 'image' && files[0]) {
      setFormData({ ...formData, image: files[0] })
      setImagePreview(URL.createObjectURL(files[0]))
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.confession) {
      toast.error(t('admin.pleaseSelectConfession'))
      return
    }

    setLoading(true)

    try {
      const submitData = new FormData()
      submitData.append('confession', formData.confession)
      submitData.append('title', formData.title)
      submitData.append('content', formData.content)
      submitData.append('is_pinned', formData.is_pinned)

      if (formData.image) {
        submitData.append('image', formData.image)
      }

      if (formData.video_url) {
        submitData.append('video_url', formData.video_url)
      }

      await confessionAPI.createPost(submitData)

      toast.success(t('admin.postCreatedSuccess'))

      // Reset form
      setFormData({
        confession: '',
        title: '',
        content: '',
        image: null,
        video_url: '',
        is_pinned: false
      })
      setImagePreview(null)
    } catch (error) {
      toast.error(error.response?.data?.confession?.[0] || t('admin.failedToCreatePost'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <FiPlus className="text-white" size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('admin.createNewPost')}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Confession Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('admin.confession')} *
          </label>
          <input
            type="number"
            name="confession"
            value={formData.confession}
            onChange={handleChange}
            required
            placeholder={t('admin.enterConfessionID')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('admin.enterConfessionIDYouManage')}
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('admin.title')} *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder={t('admin.enterPostTitle')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('admin.content')} *
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows="8"
            placeholder={t('admin.writePostContent')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FiImage className="inline mr-2" />
            {t('admin.imageOptional')}
          </label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt={t('admin.preview')}
                className="w-full max-h-64 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Video URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FiVideo className="inline mr-2" />
            {t('admin.videoURL')}
          </label>
          <input
            type="url"
            name="video_url"
            value={formData.video_url}
            onChange={handleChange}
            placeholder={t('admin.videoURLPlaceholder')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('admin.enterYouTubeVimeoURL')}
          </p>
        </div>

        {/* Pin Post */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="is_pinned"
            checked={formData.is_pinned}
            onChange={handleChange}
            className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('admin.pinThisPostToTop')}
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('admin.creatingPost') : t('admin.createPost')}
        </button>
      </form>
    </div>
  )
}

// Component for superadmin - confession management
const SuperAdminPanel = () => {
  const { t } = useLanguage()
  const [confessions, setConfessions] = useState([])
  const [adminUsers, setAdminUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigningAdmin, setAssigningAdmin] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [confessionsData, adminsData] = await Promise.all([
        confessionAPI.getConfessions({ page_size: 100 }),
        authAPI.getAdminUsers()
      ])
      setConfessions(confessionsData.results || confessionsData)
      setAdminUsers(adminsData)
    } catch (error) {
      toast.error(t('admin.failedToLoadData'))
    } finally {
      setLoading(false)
    }
  }

  const handleAssignAdmin = async (confessionSlug, adminId) => {
    if (!adminId) {
      toast.error(t('admin.pleaseSelectAdmin'))
      return
    }

    setAssigningAdmin({ ...assigningAdmin, [confessionSlug]: true })

    try {
      await confessionAPI.assignAdmin(confessionSlug, adminId)
      toast.success(t('admin.adminAssignedSuccess'))
      await fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || t('admin.failedToAssignAdmin'))
    } finally {
      setAssigningAdmin({ ...assigningAdmin, [confessionSlug]: false })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <FiUsers className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('admin.confessionManagement')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.assignAdminsToConfessions')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {confessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('admin.noConfessionsFound')}
          </div>
        ) : (
          confessions.map((confession) => (
            <div
              key={confession.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-blue-300 dark:hover:border-blue-500 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {confession.logo && (
                    <img
                      src={confession.logo}
                      alt={confession.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{confession.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{confession.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{confession.subscribers_count} {t('admin.subscribers')}</span>
                      <span>{confession.posts_count} {t('common.posts')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.currentAdmin')} {confession.admin?.username || t('admin.notAssigned')}
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => handleAssignAdmin(confession.slug, e.target.value)}
                    disabled={assigningAdmin[confession.slug]}
                    defaultValue=""
                  >
                    <option value="">{t('admin.selectAdminToAssign')}</option>
                    {adminUsers.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.username} ({admin.role}) - {admin.email}
                      </option>
                    ))}
                  </select>
                </div>
                {assigningAdmin[confession.slug] && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const AdminPanel = () => {
  const { user } = useAuthStore()
  const { t } = useLanguage()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('admin.panel')}</h1>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <FiArrowLeft />
            <span>{t('admin.returnToSite')}</span>
          </Link>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.role === 'superadmin'
            ? t('admin.manageConfessionsAndAdmins')
            : t('admin.managePostsForConfession')
          }
        </p>
      </div>

      {user?.role === 'superadmin' ? (
        <SuperAdminPanel />
      ) : (
        <AdminPostCreation user={user} />
      )}
    </div>
  )
}

export default AdminPanel
