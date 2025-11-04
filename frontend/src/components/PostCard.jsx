import React from 'react'
import { Link } from 'react-router-dom'
import { FiHeart, FiMessageCircle, FiPin } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

const PostCard = ({ post, onLike, onUnlike }) => {
  const handleLikeToggle = (e) => {
    e.preventDefault()
    if (post.is_liked) {
      onUnlike(post.id)
    } else {
      onLike(post.id)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <Link
            to={`/confession/${post.confession.slug}`}
            className="flex items-center space-x-3"
          >
            {post.confession.logo && (
              <img
                src={post.confession.logo}
                alt={post.confession.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <h4 className="font-semibold text-gray-800 hover:text-blue-600">
                {post.confession.name}
              </h4>
              <p className="text-xs text-gray-500">
                by {post.author.username} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </Link>

          {post.is_pinned && (
            <div className="flex items-center space-x-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
              <FiPin size={14} />
              <span className="text-xs font-medium">Pinned</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <Link to={`/post/${post.id}`} className="block">
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-800 mb-2 hover:text-blue-600">
            {post.title}
          </h3>

          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.content}
          </p>

          {/* Image */}
          {post.image && (
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
          )}

          {/* Video */}
          {post.video_url && (
            <div className="relative pb-[56.25%] mb-4 rounded-lg overflow-hidden">
              <iframe
                src={post.video_url}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={handleLikeToggle}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            post.is_liked
              ? 'text-red-600 bg-red-50 hover:bg-red-100'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FiHeart
            size={18}
            fill={post.is_liked ? 'currentColor' : 'none'}
          />
          <span className="font-medium">{post.likes_count}</span>
        </button>

        <Link
          to={`/post/${post.id}`}
          className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
        >
          <FiMessageCircle size={18} />
          <span className="font-medium">{post.comments_count}</span>
        </Link>
      </div>
    </div>
  )
}

export default PostCard