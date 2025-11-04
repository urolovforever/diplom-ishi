import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { FiTrash2, FiSend } from 'react-icons/fi'

const CommentSection = ({ postId }) => {
  const { user } = useAuthStore()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId])

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
      toast.success('Comment added!')
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return

    try {
      await confessionAPI.deleteComment(commentId)
      setComments(comments.filter(c => c.id !== commentId))
      toast.success('Comment deleted')
    } catch (error) {
      toast.error('Failed to delete comment')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex space-x-3">
            {user.avatar && (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend size={16} />
                  <span>{loading ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
              {comment.author.avatar && (
                <img
                  src={comment.author.avatar}
                  alt={comment.author.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="font-semibold text-gray-800">
                      {comment.author.username}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {user && (user.id === comment.author.id || user.role === 'admin' || user.role === 'superadmin') && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CommentSection