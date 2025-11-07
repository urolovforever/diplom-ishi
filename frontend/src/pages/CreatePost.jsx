import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import MainLayout from '../components/layout/MainLayout'
import Loading from '../components/Loading'
import { FiImage, FiX, FiVideo, FiUpload, FiPlus, FiFileText } from 'react-icons/fi'

const CreatePost = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    confession: '',
    is_pinned: false,
    comments_enabled: true
  })

  const [confessions, setConfessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [images, setImages] = useState([])
  const [video, setVideo] = useState(null)
  const [pdfs, setPdfs] = useState([])

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
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Check all files are images
    const allImages = files.every(file => file.type.startsWith('image/'))
    if (!allImages) {
      toast.error('Please upload only image files')
      return
    }

    setImages(prev => [...prev, ...files])
  }

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload only video files')
      return
    }

    setVideo(file)
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeVideo = () => {
    setVideo(null)
  }

  const clearAllImages = () => {
    setImages([])
  }

  const handlePdfChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Check all files are PDFs
    const allPdfs = files.every(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
    if (!allPdfs) {
      toast.error('Please upload only PDF files')
      return
    }

    setPdfs(prev => [...prev, ...files])
  }

  const removePdf = (index) => {
    setPdfs(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllPdfs = () => {
    setPdfs([])
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
      if (images.length > 0) {
        images.forEach((file) => {
          postFormData.append('media_files_data', file)
        })
      } else if (video) {
        postFormData.append('media_files_data', video)
      } else if (pdfs.length > 0) {
        pdfs.forEach((file) => {
          postFormData.append('media_files_data', file)
        })
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

          {/* Images Section */}
          <div className={`space-y-3 ${video || pdfs.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                📸 Images {images.length > 0 && `(${images.length})`}
              </label>
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllImages}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {images.length > 0 ? (
              <div className="space-y-3">
                {/* Images Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Image ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <FiX size={16} />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  ))}

                  {/* Add More Button */}
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors group">
                    <FiPlus size={32} className="text-blue-400 mb-1 group-hover:text-blue-600" />
                    <span className="text-xs text-gray-600 font-medium">Add More</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors group">
                <FiImage size={32} className="text-blue-400 mb-2 group-hover:text-blue-600" />
                <span className="text-sm text-gray-600 font-medium">Upload Images</span>
                <span className="text-xs text-gray-500 mt-1">Multiple files allowed • JPG, PNG, GIF, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={video !== null || pdfs.length > 0}
                />
              </label>
            )}
          </div>

          {/* Video Section */}
          <div className={`space-y-3 ${images.length > 0 || pdfs.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                🎥 Video {video && '(1)'}
              </label>
              {video && (
                <button
                  type="button"
                  onClick={removeVideo}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            {video ? (
              <div className="relative">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    src={URL.createObjectURL(video)}
                    className="w-full h-full object-contain"
                    controls
                  />
                </div>
                <div className="mt-2 flex items-center justify-between px-2">
                  <span className="text-sm text-gray-600">{video.name}</span>
                  <span className="text-sm text-gray-500">{(video.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors group">
                <FiVideo size={32} className="text-purple-400 mb-2 group-hover:text-purple-600" />
                <span className="text-sm text-gray-600 font-medium">Upload Video</span>
                <span className="text-xs text-gray-500 mt-1">One file only • MP4, MOV, AVI, WEBM</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                  disabled={images.length > 0 || pdfs.length > 0}
                />
              </label>
            )}
          </div>

          {/* PDF Section */}
          <div className={`space-y-3 ${images.length > 0 || video ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                📄 PDF Documents {pdfs.length > 0 && `(${pdfs.length})`}
              </label>
              {pdfs.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllPdfs}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {pdfs.length > 0 ? (
              <div className="space-y-3">
                {/* PDFs List */}
                <div className="space-y-2">
                  {pdfs.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <FiFileText size={24} className="text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePdf(index)}
                          className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add More Button */}
                  <label className="flex items-center justify-center p-4 border-2 border-dashed border-red-300 rounded-lg cursor-pointer hover:bg-red-50 transition-colors group">
                    <FiPlus size={24} className="text-red-400 mr-2 group-hover:text-red-600" />
                    <span className="text-sm text-gray-600 font-medium">Add More PDFs</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      onChange={handlePdfChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-red-300 rounded-lg cursor-pointer hover:bg-red-50 transition-colors group">
                <FiFileText size={32} className="text-red-400 mb-2 group-hover:text-red-600" />
                <span className="text-sm text-gray-600 font-medium">Upload PDFs</span>
                <span className="text-xs text-gray-500 mt-1">Multiple files allowed • PDF format</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handlePdfChange}
                  className="hidden"
                  disabled={images.length > 0 || video !== null}
                />
              </label>
            )}
          </div>

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
