import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import MainLayout from '../components/layout/MainLayout'
import CommentSection from '../components/CommentSection'
import Loading from '../components/Loading'
import MediaCarousel from '../components/MediaCarousel'
import VideoPlayer from '../components/VideoPlayer'
import { FiHeart, FiMessageCircle, FiArrowLeft, FiEye, FiFileText } from 'react-icons/fi'
import { BsPinFill } from 'react-icons/bs'
import { formatDistanceToNow } from 'date-fns'

const PostDetails = () => {
  const { id } = useParams()
  const { user } = useAuthStore()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [id])

  const fetchPost = async () => {
    setLoading(true)
    try {
      const data = await confessionAPI.getPost(id)
      setPost(data)
    } catch (error) {
      toast.error('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  const handleLikeToggle = async () => {
    if (!user) {
      toast.error('Please login to like posts')
      return
    }

    try {
      if (post.is_liked) {
        await confessionAPI.unlikePost(id)
        setPost({
          ...post,
          is_liked: false,
          likes_count: post.likes_count - 1
        })
      } else {
        await confessionAPI.likePost(id)
        setPost({
          ...post,
          is_liked: true,
          likes_count: post.likes_count + 1
        })
      }
    } catch (error) {
      toast.error('Failed to update like')
    }
  }

  if (loading) return (
    <MainLayout>
      <Loading />
    </MainLayout>
  )

  if (!post) return (
    <MainLayout>
      <div className="text-center py-12">Post not found</div>
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

      {/* Post Content */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Link
              to={`/confession/${post.confession.slug}`}
              className="flex items-center space-x-3 hover:opacity-80"
            >
              {post.confession.logo && (
                <img
                  src={post.confession.logo}
                  alt={post.confession.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-800">
                  {post.confession.name}
                </h3>
                <p className="text-sm text-gray-500">
                  by {post.author.username} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </Link>

            {post.is_pinned && (
              <div className="flex items-center space-x-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                <BsPinFill size={16} />
                <span className="text-sm font-medium">Pinned</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {post.title}
          </h1>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Media Display - New system (media_files) or fallback to old system (image) */}
          {post.media_files && post.media_files.length > 0 ? (
            <div className="mb-6">
              {post.media_files.some(media => media.media_type === 'pdf') ? (
                // If there's a PDF, show PDF viewer
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 p-4 border-b border-red-100 flex items-center space-x-3">
                    <FiFileText size={24} className="text-red-600" />
                    <div>
                      <p className="font-medium text-gray-800">PDF Document</p>
                      <p className="text-sm text-gray-500">
                        {post.media_files.find(media => media.media_type === 'pdf')?.file.split('/').pop()}
                      </p>
                    </div>
                  </div>
                  <iframe
                    src={post.media_files.find(media => media.media_type === 'pdf')?.file}
                    className="w-full h-[600px]"
                    title="PDF Viewer"
                  />
                </div>
              ) : post.media_files.some(media => media.media_type === 'video') ? (
                // If there's a video, show video player
                <VideoPlayer videoFile={post.media_files.find(media => media.media_type === 'video')} />
              ) : (
                // If there are only images, show carousel
                <MediaCarousel mediaFiles={post.media_files.filter(media => media.media_type === 'image')} />
              )}
            </div>
          ) : post.image ? (
            // Fallback: Old system - single image field
            <img
              src={post.image}
              alt={post.title}
              className="w-full rounded-lg mb-6"
            />
          ) : null}

          {/* Text Content */}
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLikeToggle}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                post.is_liked
                  ? 'text-red-600 bg-red-50 hover:bg-red-100'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiHeart
                size={20}
                fill={post.is_liked ? 'currentColor' : 'none'}
              />
              <span>{post.likes_count} {post.likes_count === 1 ? 'Like' : 'Likes'}</span>
            </button>

            <div className="flex items-center space-x-2 text-gray-600 px-4 py-2">
              <FiMessageCircle size={20} />
              <span>{post.comments_count} {post.comments_count === 1 ? 'Comment' : 'Comments'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-gray-500">
            <FiEye size={18} />
            <span>{post.views_count || 0} views</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <CommentSection postId={post.id} commentsEnabled={post.comments_enabled} />
      </div>
    </MainLayout>
  )
}

export default PostDetails