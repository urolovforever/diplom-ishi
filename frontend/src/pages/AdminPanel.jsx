import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import { FiPlus, FiImage, FiVideo } from 'react-icons/fi'

const AdminPanel = () => {
  const { user } = useAuthStore()

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
      toast.error('Please select a confession')
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

      toast.success('Post created successfully!')

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
      toast.error(error.response?.data?.confession?.[0] || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Create and manage posts for your confession</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <FiPlus className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Create New Post</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Confession Selection (for superadmin) */}
          {user?.role === 'superadmin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confession *
              </label>
              <input
                type="number"
                name="confession"
                value={formData.confession}
                onChange={handleChange}
                required
                placeholder="Enter confession ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Note: You need to enter the confession ID. This will be improved in future versions.
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter post title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows="8"
              placeholder="Write your post content..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiImage className="inline mr-2" />
              Image (optional)
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiVideo className="inline mr-2" />
              Video URL (optional)
            </label>
            <input
              type="url"
              name="video_url"
              value={formData.video_url}
              onChange={handleChange}
              placeholder="https://youtube.com/embed/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter YouTube or Vimeo embed URL
            </p>
          </div>

          {/* Pin Post */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_pinned"
              checked={formData.is_pinned}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Pin this post to the top
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Post...' : 'Create Post'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminPanel