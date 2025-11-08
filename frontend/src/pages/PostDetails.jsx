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
import { formatUsername } from '../utils/formatters'
import { useLanguage } from '../contexts/LanguageContext'

const PostDetails = () => {
  const { id } = useParams()
  const { user } = useAuthStore()
  const { t } = useLanguage()

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
      <div className="text-center py-12 text-gray-800 dark:text-gray-200">Post not found</div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 transition-colors"
      >
        <FiArrowLeft />
        <span>{t('common.backToHome')}</span>
      </Link>

      {/* Post Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Link
              to={`/confession/${post.confession.slug}`}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              {post.confession.logo && (
                <img
                  src={post.confession.logo}
                  alt={post.confession.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  {post.confession.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('common.by')} {formatUsername(post.author.username)} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </Link>

            {post.is_pinned && (
              <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                <BsPinFill size={16} />
                <span className="text-sm font-medium">{t('common.pinned')}</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {post.title}
          </h1>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Media Display - New system (media_files) or fallback to old system (image) */}
          {post.media_files && post.media_files.length > 0 ? (
            <div className="mb-6">
              {post.media_files.some(media => media.media_type === 'pdf') ? (
                // If there are PDFs, show compact list with download links
                <div className="space-y-2">
                  {post.media_files.filter(media => media.media_type === 'pdf').map((pdfFile, index) => (
                    <a
                      key={index}
                      href={pdfFile.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-red-200 dark:bg-red-800 rounded-lg flex items-center justify-center">
                        <FiFileText size={24} className="text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                          {pdfFile.file.split('/').pop()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.pdfDocument')} • {t('common.clickToOpen')}</p>
                      </div>
                    </a>
                  ))}
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
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLikeToggle}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                post.is_liked
                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FiHeart
                size={20}
                fill={post.is_liked ? 'currentColor' : 'none'}
              />
              <span>{post.likes_count} {post.likes_count === 1 ? t('common.like') : t('common.like') + 's'}</span>
            </button>

            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 px-4 py-2">
              <FiMessageCircle size={20} />
              <span>{post.comments_count} {post.comments_count === 1 ? t('common.comment') : t('common.comments')}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <FiEye size={18} />
            <span>{post.views_count || 0} {t('common.views')}</span>
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