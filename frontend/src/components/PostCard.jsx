import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiHeart, FiMessageCircle, FiEdit2, FiTrash2, FiEye, FiFileText } from 'react-icons/fi'
import { BsPinFill } from 'react-icons/bs'
import MediaCarousel from './MediaCarousel'
import VideoPlayer from './VideoPlayer'
import { formatUsername, formatRelativeTime } from '../utils/formatters'
import { useLanguage } from '../contexts/LanguageContext'

const PostCard = ({ post, onLike, onUnlike, onDelete, isConfessionAdmin }) => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const handleLikeToggle = (e) => {
    e.preventDefault()
    if (post.is_liked) {
      onUnlike(post.id)
    } else {
      onLike(post.id)
    }
  }

  const handleEdit = (e) => {
    e.preventDefault()
    navigate(`/post/${post.id}/edit`)
  }

  const handleDelete = (e) => {
    e.preventDefault()
    if (onDelete) {
      onDelete(post.id)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <Link
            to={`/confession/${post.confession.slug}`}
            className="flex items-center space-x-3 no-underline"
          >
            {post.confession.logo && (
              <img
                src={post.confession.logo}
                alt={post.confession.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div className="no-underline">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 no-underline">
                {post.confession.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 no-underline">
                {t('common.by')} {formatUsername(post.author.username)} • {formatRelativeTime(post.created_at, language)}
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            {post.is_pinned && (
              <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full no-underline">
                <BsPinFill size={14} />
                <span className="text-xs font-medium no-underline">{t('common.pinned')}</span>
              </div>
            )}

            {isConfessionAdmin && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleEdit}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title={t('common.edit')}
                >
                  <FiEdit2 size={18} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title={t('common.delete')}
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <Link to={`/post/${post.id}`} className="block no-underline">
        <div className="p-4 no-underline">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 hover:text-blue-600 dark:hover:text-blue-400 no-underline">
            {post.title}
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 no-underline">
            {post.content}
          </p>
        </div>

        {/* Media Display - New system (media_files) or fallback to old system (image) */}
        {post.media_files && post.media_files.length > 0 ? (
          // New system: Display media from media_files
          post.media_files.some(media => media.media_type === 'pdf') ? (
            // If there's a PDF, don't show any media - just title and description above
            null
          ) : post.media_files.some(media => media.media_type === 'video') ? (
            // If there's a video, show video player
            <VideoPlayer videoFile={post.media_files.find(media => media.media_type === 'video')} />
          ) : (
            // If there are only images, show carousel
            <MediaCarousel mediaFiles={post.media_files.filter(media => media.media_type === 'image')} />
          )
        ) : post.image ? (
          // Fallback: Old system - single image field
          <div className="relative w-full aspect-[4/3] bg-gray-100">
            <img
              src={post.image}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ) : null}
      </Link>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLikeToggle}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors no-underline ${
              post.is_liked
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FiHeart
              size={18}
              fill={post.is_liked ? 'currentColor' : 'none'}
            />
            <span className="font-medium no-underline">{post.likes_count}</span>
          </button>

          {/* Only show comment icon if comments are enabled */}
          {post.comments_enabled !== false && (
            <Link
              to={`/post/${post.id}`}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors no-underline"
            >
              <FiMessageCircle size={18} />
              <span className="font-medium no-underline">{post.comments_count}</span>
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm no-underline">
          <FiEye size={16} />
          <span className="no-underline">{post.views_count || 0}</span>
        </div>
      </div>
    </div>
  )
}

export default PostCard