import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { FiTrash2, FiSend, FiHeart, FiMessageCircle } from 'react-icons/fi'
import { FaHeart } from 'react-icons/fa'

const CommentItem = ({ comment, post, user, onDelete, onLikeToggle, onReply, level = 0 }) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canDeleteComment = () => {
    if (!user) return false
    if (user.id === comment.author.id) return true
    if (post && post.confession.admin?.id === user.id) return true
    if (user.role === 'superadmin') return true
    return false
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return

    setSubmitting(true)
    try {
      await confessionAPI.createComment({
        post: comment.post,
        parent: comment.id,
        content: replyText
      })
      setReplyText('')
      setShowReplyForm(false)
      toast.success('Reply posted!')
      onReply()
    } catch (error) {
      toast.error('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`${level > 0 ? 'ml-12 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex space-x-3 py-3">
        {/* Avatar */}
        {comment.author.avatar ? (
          <img
            src={comment.author.avatar}
            alt={comment.author.username}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {comment.author.username[0].toUpperCase()}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Username and time */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-sm text-gray-900">
              {comment.author.username}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Comment text */}
          <p className="text-sm text-gray-800 mb-2 break-words">{comment.content}</p>

          {/* Action buttons */}
          <div className="flex items-center space-x-4 text-xs">
            {/* Like button */}
            {user && (
              <button
                onClick={() => onLikeToggle(comment.id, comment.is_liked)}
                className={`flex items-center space-x-1 font-semibold transition-colors ${
                  comment.is_liked
                    ? 'text-red-600'
                    : 'text-gray-500 hover:text-red-600'
                }`}
              >
                {comment.is_liked ? (
                  <FaHeart size={12} />
                ) : (
                  <FiHeart size={12} />
                )}
                {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
              </button>
            )}

            {/* Reply button */}
            {user && level < 1 && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="font-semibold text-gray-500 hover:text-blue-600 transition-colors"
              >
                Reply
              </button>
            )}

            {/* Delete button */}
            {canDeleteComment() && (
              <button
                onClick={() => onDelete(comment.id)}
                className="font-semibold text-gray-500 hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply form */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.author.username}...`}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </form>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  post={post}
                  user={user}
                  onDelete={onDelete}
                  onLikeToggle={onLikeToggle}
                  onReply={onReply}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CommentSection = ({ postId }) => {
  const { user } = useAuthStore()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState(null)

  useEffect(() => {
    fetchPostData()
    fetchComments()
  }, [postId])

  const fetchPostData = async () => {
    try {
      const data = await confessionAPI.getPost(postId)
      setPost(data)
    } catch (error) {
      console.error('Failed to fetch post:', error)
    }
  }

  const fetchComments = async () => {
    try {
      const data = await confessionAPI.getComments(postId)
      setComments(data.results || data)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please login to comment')
      return
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    setLoading(true)
    try {
      await confessionAPI.createComment({
        post: postId,
        content: newComment
      })
      setNewComment('')
      await fetchComments()
      toast.success('Comment posted!')
    } catch (error) {
      toast.error('Failed to post comment')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return

    try {
      await confessionAPI.deleteComment(commentId)
      await fetchComments()
      toast.success('Comment deleted')
    } catch (error) {
      toast.error('Failed to delete comment')
    }
  }

  const handleLikeToggle = async (commentId, isLiked) => {
    try {
      if (isLiked) {
        await confessionAPI.unlikeComment(commentId)
      } else {
        await confessionAPI.likeComment(commentId)
      }
      await fetchComments()
    } catch (error) {
      toast.error('Failed to update like')
    }
  }

  const totalComments = comments.reduce((sum, comment) => {
    return sum + 1 + (comment.replies?.length || 0)
  }, 0)

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Comments ({totalComments})
      </h3>

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-6 border-b border-gray-200 pb-6">
          <div className="flex space-x-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">
                  {user.username[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-4 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div>
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                post={post}
                user={user}
                onDelete={handleDelete}
                onLikeToggle={handleLikeToggle}
                onReply={fetchComments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentSection
