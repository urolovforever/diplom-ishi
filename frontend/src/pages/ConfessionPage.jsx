import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import MainLayout from '../components/layout/MainLayout'
import Loading from '../components/Loading'
import { FiUsers, FiFileText, FiUserPlus, FiUserMinus, FiEdit2, FiX, FiImage, FiTrash2, FiEye, FiHeart, FiMessageCircle } from 'react-icons/fi'

const ConfessionPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [confession, setConfession] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    logo: null
  })
  const [logoPreview, setLogoPreview] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [slug])

  const fetchData = async () => {
    setLoading(true)
    try {
      // First get confession data
      const confessionData = await confessionAPI.getConfession(slug)
      setConfession(confessionData)
      setEditFormData({
        name: confessionData.name,
        description: confessionData.description,
        logo: null
      })
      setLogoPreview(confessionData.logo)

      // Then get posts using confession ID
      const postsData = await confessionAPI.getPosts({ confession: confessionData.id })
      setPosts(postsData.results || postsData)
    } catch (error) {
      toast.error('Failed to load confession')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please login to subscribe')
      return
    }

    setSubscribing(true)
    try {
      if (confession.is_subscribed) {
        await confessionAPI.unsubscribe(slug)
        setConfession({ ...confession, is_subscribed: false })
        toast.success('Unsubscribed successfully')
      } else {
        await confessionAPI.subscribe(slug)
        setConfession({ ...confession, is_subscribed: true })
        toast.success('Subscribed successfully')
      }
    } catch (error) {
      toast.error('Failed to update subscription')
    } finally {
      setSubscribing(false)
    }
  }

  const handleLike = async (postId) => {
    try {
      await confessionAPI.likePost(postId)
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, is_liked: true, likes_count: post.likes_count + 1 }
          : post
      ))
    } catch (error) {
      toast.error('Failed to like post')
    }
  }

  const handleUnlike = async (postId) => {
    try {
      await confessionAPI.unlikePost(postId)
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, is_liked: false, likes_count: post.likes_count - 1 }
          : post
      ))
    } catch (error) {
      toast.error('Failed to unlike post')
    }
  }

  const handleEditClick = () => {
    setEditFormData({
      name: confession.name,
      description: confession.description,
      logo: null
    })
    setLogoPreview(confession.logo)
    setShowEditModal(true)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setEditFormData(prev => ({ ...prev, logo: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const formData = new FormData()
      formData.append('name', editFormData.name)
      formData.append('description', editFormData.description)

      if (editFormData.logo) {
        formData.append('logo', editFormData.logo)
      }

      const updatedConfession = await confessionAPI.updateConfession(slug, formData)
      setConfession(updatedConfession)
      toast.success('Confession updated successfully!')
      setShowEditModal(false)
    } catch (error) {
      toast.error(error.response?.data?.name?.[0] || 'Failed to update confession')
    } finally {
      setUpdating(false)
    }
  }

  const handlePostDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      await confessionAPI.deletePost(postId)
      setPosts(posts.filter(post => post.id !== postId))
      toast.success('Post deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete post')
    }
  }

  const handlePostClick = (postId) => {
    const canView = user && (confession.is_subscribed || isConfessionAdmin || user.role === 'superadmin')

    if (!user) {
      toast.error('Please login to view posts')
      return
    }

    if (!canView) {
      toast.error('Subscribe to this confession to view posts')
      return
    }

    navigate(`/post/${postId}`)
  }

  const handleEditPost = (e, postId) => {
    e.stopPropagation()
    navigate(`/post/${postId}/edit`)
  }

  const handleDeletePost = async (e, postId) => {
    e.stopPropagation()
    await handlePostDelete(postId)
  }

  // Check if user is admin of this confession
  const isConfessionAdmin = user && confession?.admin?.id === user.id

  if (loading) return (
    <MainLayout>
      <Loading />
    </MainLayout>
  )

  if (!confession) return (
    <MainLayout>
      <div className="text-center py-12">Confession not found</div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6">
            {confession.logo && (
              <img
                src={confession.logo}
                alt={confession.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {confession.name}
              </h1>
              <p className="text-gray-600 mb-4">{confession.description}</p>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <Link
                  to={`/confession/${slug}/followers`}
                  className="flex items-center space-x-1 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <FiUsers />
                  <span>{confession.subscribers_count} followers</span>
                </Link>
                <div className="flex items-center space-x-1">
                  <FiFileText />
                  <span>{confession.posts_count} posts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isConfessionAdmin && (
              <button
                onClick={handleEditClick}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FiEdit2 />
                <span>Edit</span>
              </button>
            )}
            {user && (
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  confession.is_subscribed
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {confession.is_subscribed ? <FiUserMinus /> : <FiUserPlus />}
                <span>{confession.is_subscribed ? 'Unsubscribe' : 'Subscribe'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 px-4">Posts</h2>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 text-lg">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {posts.map(post => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="relative aspect-square cursor-pointer group overflow-hidden bg-gray-100"
              >
                {/* Post Image or Gradient */}
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center p-4">
                    <h3 className="text-white text-center font-semibold text-sm md:text-base line-clamp-3">
                      {post.title}
                    </h3>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white space-y-2">
                    {/* Stats */}
                    <div className="flex items-center justify-center space-x-4 text-sm md:text-base">
                      <div className="flex items-center space-x-1">
                        <FiHeart fill="white" />
                        <span className="font-semibold">{post.likes_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiMessageCircle fill="white" />
                        <span className="font-semibold">{post.comments_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiEye />
                        <span className="font-semibold">{post.views_count || 0}</span>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isConfessionAdmin && (
                      <div className="flex items-center justify-center space-x-2 mt-3">
                        <button
                          onClick={(e) => handleEditPost(e, post.id)}
                          className="p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
                          title="Edit post"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDeletePost(e, post.id)}
                          className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                          title="Delete post"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Edit Confession</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confession Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Logo
                </label>
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditFormData(prev => ({ ...prev, logo: null }))
                        setLogoPreview(null)
                      }}
                      className="absolute top-0 right-0 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">
                    <FiImage size={32} className="text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? 'Updating...' : 'Update Confession'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </MainLayout>
  )
}

export default ConfessionPage
