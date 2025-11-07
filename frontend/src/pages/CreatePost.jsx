import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import MainLayout from '../components/layout/MainLayout'
import Loading from '../components/Loading'
import { FiImage, FiX, FiVideo, FiUpload } from 'react-icons/fi'

const CreatePost = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    confession: '',
    image: null,
    is_pinned: false,
    comments_enabled: true
  })

  const [confessions, setConfessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [mediaFiles, setMediaFiles] = useState([])
  const [mediaType, setMediaType] = useState(null) // 'images' or 'video'

  useEffect(() => {
    fetchConfessions()
  }, [])

  const fetchConfessions = async () => {
    try {
      const data = await confessionAPI.getConfessions()
      let confessionsList = data.results || data

      // Filter confessions for admin - only show the ones they manage
      if (user.role === 'admin') {
        confessionsList = confessionsList.filter(c => c.admin?.id === user.id)
      }

      setConfessions(confessionsList)

      // Auto-select confession if user is confession admin
      if (user.role === 'admin' && confessionsList.length > 0) {
        setFormData(prev => ({ ...prev, confession: confessionsList[0].id }))
      }
    } catch (error) {
      toast.error('Failed to load confessions')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMediaFilesChange = (e) => {
    const files = Array.from(e.target.files)

    if (files.length === 0) return

    // Check if files are videos or images
    const firstFile = files[0]
    const isVideo = firstFile.type.startsWith('video/')
    const isImage = firstFile.type.startsWith('image/')

    if (isVideo && files.length > 1) {
      toast.error('Only one video can be uploaded per post')
      return
    }

    if (isVideo) {
      setMediaType('video')
      setMediaFiles([firstFile])
    } else if (isImage) {
      setMediaType('images')
      setMediaFiles(files)
    } else {
      toast.error('Please upload only images or video files')
      return
    }
  }

  const removeMediaFile = (index) => {
    setMediaFiles(prev => {
      const updated = prev.filter((_, i) => i !== index)
      if (updated.length === 0) {
        setMediaType(null)
      }
      return updated
    })
  }

  const clearAllMedia = () => {
    setMediaFiles([])
    setMediaType(null)
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }))
    setImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.content || !formData.confession) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const postFormData = new FormData()
      postFormData.append('title', formData.title)
      postFormData.append('content', formData.content)
      postFormData.append('confession', formData.confession)
      postFormData.append('is_pinned', formData.is_pinned)
      postFormData.append('comments_enabled', formData.comments_enabled)

      // Add new media files if present
      if (mediaFiles.length > 0) {
        mediaFiles.forEach((file) => {
          postFormData.append('media_files_data', file)
        })
      } else if (formData.image) {
        // Fallback to old single image field
        postFormData.append('image', formData.image)
      }

      await confessionAPI.createPost(postFormData)
      toast.success('Post created successfully!')
      navigate('/')
    } catch (error) {
      toast.error('Failed to create post')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout showRightSidebar={false}>
        <Loading />
      </MainLayout>
    )
  }

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Post</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Confession Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confession <span className="text-red-500">*</span>
            </label>
            <select
              name="confession"
              value={formData.confession}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a confession</option>
              {confessions.map(confession => (
                <option key={confession.id} value={confession.id}>
                  {confession.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter post title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your post content..."
              rows="8"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Media Upload - New System */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Media (Images or Video)
            </label>

            {mediaFiles.length > 0 ? (
              <div className="space-y-3">
                {/* Media Type Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {mediaType === 'video' ? (
                      <>
                        <FiVideo className="text-purple-600" size={20} />
                        <span className="text-sm font-medium text-gray-700">Video Selected</span>
                      </>
                    ) : (
                      <>
                        <FiImage className="text-blue-600" size={20} />
                        <span className="text-sm font-medium text-gray-700">
                          {mediaFiles.length} Image{mediaFiles.length > 1 ? 's' : ''} Selected
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearAllMedia}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>

                {/* Media Previews */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type.startsWith('video/') ? (
                        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                          <video
                            src={URL.createObjectURL(file)}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <FiVideo size={32} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMediaFile(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <FiX size={16} />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Upload Button for Images */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors group">
                  <FiImage size={32} className="text-blue-400 mb-2 group-hover:text-blue-600" />
                  <span className="text-sm text-gray-600 font-medium">Upload Images (Multiple)</span>
                  <span className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WEBP</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMediaFilesChange}
                    className="hidden"
                  />
                </label>

                {/* Upload Button for Video */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors group">
                  <FiVideo size={32} className="text-purple-400 mb-2 group-hover:text-purple-600" />
                  <span className="text-sm text-gray-600 font-medium">Upload Video (Single)</span>
                  <span className="text-xs text-gray-500 mt-1">MP4, MOV, AVI, WEBM</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleMediaFilesChange}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-gray-500 text-center">
                  Upload multiple images OR one video per post
                </p>
              </div>
            )}
          </div>

          {/* Old Image Upload - Fallback (hidden if new media system is used) */}
          {mediaFiles.length === 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Or upload single image (Legacy)
              </label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <FiImage size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Click to upload single image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Comments Toggle */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              name="comments_enabled"
              id="comments_enabled"
              checked={formData.comments_enabled}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="comments_enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
              Allow comments on this post
            </label>
          </div>

          {/* Pin Post - Only for admins */}
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                name="is_pinned"
                id="is_pinned"
                checked={formData.is_pinned}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_pinned" className="text-sm font-medium text-gray-700 cursor-pointer">
                Pin this post to the top of the confession
              </label>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Post'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

export default CreatePost
