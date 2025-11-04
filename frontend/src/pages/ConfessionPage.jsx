import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'
import { FiUsers, FiFileText, FiUserPlus, FiUserMinus } from 'react-icons/fi'

const ConfessionPage = () => {
  const { slug } = useParams()
  const { user } = useAuthStore()

  const [confession, setConfession] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [slug])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [confessionData, postsData] = await Promise.all([
        confessionAPI.getConfession(slug),
        confessionAPI.getPosts({ confession: slug })
      ])
      setConfession(confessionData)
      setPosts(postsData.results || postsData)
    } catch (error) {
      toast.error('Failed to load confession')
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

  if (loading) return <Loading />
  if (!confession) return <div className="text-center py-12">Confession not found</div>

  return (
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
                <div className="flex items-center space-x-1">
                  <FiUsers />
                  <span>{confession.subscribers_count} followers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiFileText />
                  <span>{confession.posts_count} posts</span>
                </div>
              </div>
            </div>
          </div>

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

      {/* Posts */}
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Posts</h2>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 text-lg">No posts yet</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onUnlike={handleUnlike}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ConfessionPage