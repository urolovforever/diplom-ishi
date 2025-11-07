import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { FiTrash2, FiSend, FiHeart, FiEdit3, FiCheck, FiX, FiChevronDown, FiChevronUp, FiMessageCircle } from 'react-icons/fi'
import { FaHeart, FaHeart as FaHeartSolid } from 'react-icons/fa'
import { BsPinFill, BsPin } from 'react-icons/bs'

// Helper function to convert URLs to clickable links
const linkify = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {part}
        </a>
      )
    }
    return part
  })
}

const CommentItem = ({ comment, post, user, onDelete, onLikeToggle, onReply, onEdit, onPin, level = 0 }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const commentRef = useRef(null)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [collapsed, setCollapsed] = useState(false)
  const [likeAnimation, setLikeAnimation] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)

  // Scroll to comment if URL hash matches
  useEffect(() => {
    const hash = location.hash
    if (hash === `#comment-${comment.id}` && commentRef.current) {
      setTimeout(() => {
        commentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setIsHighlighted(true)
        // Remove highlight after 2 seconds
        setTimeout(() => setIsHighlighted(false), 2000)
      }, 300) // Small delay to ensure page is fully loaded
    }
  }, [location.hash, comment.id])

  const canDeleteComment = () => {
    if (!user) return false
    if (user.id === comment.author.id) return true
    if (post && post.confession.admin?.id === user.id) return true
    if (user.role === 'superadmin') return true
    return false
  }

  const canPinComment = () => {
    if (!user) return false
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

  const handleEditSubmit = async () => {
    if (!editText.trim()) return

    try {
      await confessionAPI.updateComment(comment.id, { content: editText })
      setIsEditing(false)
      toast.success('Comment updated!')
      onEdit()
    } catch (error) {
      toast.error('Failed to update comment')
    }
  }

  const handleLikeClick = () => {
    setLikeAnimation(true)
    setTimeout(() => setLikeAnimation(false), 300)
    onLikeToggle(comment.id, comment.is_liked)
  }

  const hasReplies = comment.replies && comment.replies.length > 0

  return (
    <div
      id={`comment-${comment.id}`}
      ref={commentRef}
      className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} transition-all duration-300 ${isHighlighted ? 'bg-blue-50 ring-2 ring-blue-400 rounded-lg' : ''}`}
    >
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
          {/* Username, time, and pin indicator */}
          <div className="flex items-center space-x-2 mb-1">
            <button
              onClick={() => navigate(`/user/${comment.author.username}`)}
              className="font-semibold text-sm text-gray-900 hover:text-blue-600 hover:underline transition-colors"
            >
              {comment.author.username}
            </button>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-gray-400 italic">edited</span>
            )}
            {comment.is_pinned && (
              <span className="flex items-center space-x-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                <BsPinFill size={10} />
                <span>Pinned</span>
              </span>
            )}
          </div>

          {/* Comment text or edit form */}
          {isEditing ? (
            <div className="mb-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="2"
                autoFocus
              />
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={handleEditSubmit}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700"
                >
                  <FiCheck size={12} />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditText(comment.content)
                  }}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full hover:bg-gray-300"
                >
                  <FiX size={12} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-800 mb-2 break-words whitespace-pre-wrap">
              {linkify(comment.content)}
            </p>
          )}

          {/* Action buttons */}
          {!isEditing && (
            <div className="flex items-center space-x-4 text-xs">
              {/* Like button with animation */}
              {user && (
                <button
                  onClick={handleLikeClick}
                  className={`flex items-center space-x-1 font-semibold transition-all ${
                    comment.is_liked
                      ? 'text-red-600'
                      : 'text-gray-500 hover:text-red-600'
                  } ${likeAnimation ? 'scale-125' : 'scale-100'}`}
                >
                  {comment.is_liked ? (
                    <FaHeartSolid size={12} className="animate-pulse" />
                  ) : (
                    <FiHeart size={12} />
                  )}
                  {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                </button>
              )}

              {/* Reply button */}
              {user && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Reply
                </button>
              )}

              {/* Edit button */}
              {user && user.id === comment.author.id && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1 font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <FiEdit3 size={11} />
                  <span>Edit</span>
                </button>
              )}

              {/* Pin/Unpin button */}
              {canPinComment() && (
                <button
                  onClick={() => onPin(comment.id, comment.is_pinned)}
                  className="flex items-center space-x-1 font-semibold text-gray-500 hover:text-yellow-600 transition-colors"
                >
                  {comment.is_pinned ? (
                    <>
                      <BsPinFill size={11} />
                      <span>Unpin</span>
                    </>
                  ) : (
                    <>
                      <BsPin size={11} />
                      <span>Pin</span>
                    </>
                  )}
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

              {/* Collapse/Expand replies */}
              {hasReplies && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="flex items-center space-x-1 font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {collapsed ? (
                    <>
                      <FiChevronDown size={12} />
                      <span>View {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}</span>
                    </>
                  ) : (
                    <>
                      <FiChevronUp size={12} />
                      <span>Hide replies</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Reply form */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-3 animate-fadeIn">
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
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? '...' : 'Post'}
                </button>
              </div>
            </form>
          )}

          {/* Nested replies with collapse/expand */}
          {hasReplies && !collapsed && (
            <div className="mt-3 space-y-2 animate-fadeIn">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  post={post}
                  user={user}
                  onDelete={onDelete}
                  onLikeToggle={onLikeToggle}
                  onReply={onReply}
                  onEdit={onEdit}
                  onPin={onPin}
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

const CommentSection = ({ postId, commentsEnabled = true }) => {
  const { user } = useAuthStore()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState(null)

  // If comments are disabled, show message and return early
  if (commentsEnabled === false) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Comments</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <FiMessageCircle size={48} className="mb-3 opacity-50" />
          <p className="text-lg font-medium">Comments are disabled</p>
          <p className="text-sm">The author has turned off commenting for this post</p>
        </div>
      </div>
    )
  }

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
    if (!window.confirm('Delete this comment and all its replies?')) return

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

  const handlePin = async (commentId, isPinned) => {
    try {
      if (isPinned) {
        await confessionAPI.unpinComment(commentId)
        toast.success('Comment unpinned')
      } else {
        await confessionAPI.pinComment(commentId)
        toast.success('Comment pinned')
      }
      await fetchComments()
    } catch (error) {
      toast.error('Failed to pin/unpin comment')
    }
  }

  // Calculate total comments including all nested replies
  const countAllComments = (comments) => {
    return comments.reduce((sum, comment) => {
      return sum + 1 + (comment.replies ? countAllComments(comment.replies) : 0)
    }, 0)
  }

  const totalComments = countAllComments(comments)

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
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
                className="w-full px-4 py-2 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none text-sm transition-colors"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
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
                onEdit={fetchComments}
                onPin={handlePin}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default CommentSection
