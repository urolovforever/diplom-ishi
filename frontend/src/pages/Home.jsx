import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import ConfessionCard from '../components/ConfessionCard'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'
import { FiGrid, FiList } from 'react-icons/fi'

const Home = () => {
  const { user } = useAuthStore()
  const [confessions, setConfessions] = useState([])
  const [posts, setPosts] = useState([])
  const [view, setView] = useState('confessions') // 'confessions' or 'feed'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [view, user])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (view === 'confessions') {
        const data = await confessionAPI.getConfessions()
        setConfessions(data.results || data)
      } else if (view === 'feed' && user) {
        const data = await confessionAPI.getFeed()
        setPosts(data.results || data)
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome to Religion Platform
        </h1>
        <p className="text-gray-600">
          Explore different religious confessions and stay updated with their latest posts
        </p>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex items-center space-x-4">
        <button
          onClick={() => setView('confessions')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'confessions'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FiGrid />
          <span>All Confessions</span>
        </button>

        {user && (
          <button
            onClick={() => setView('feed')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              view === 'feed'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FiList />
            <span>My Feed</span>
          </button>
        )}
      </div>

      {/* Content */}
      {view === 'confessions' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {confessions.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No confessions found</p>
            </div>
          ) : (
            confessions.map(confession => (
              <ConfessionCard key={confession.id} confession={confession} />
            ))
          )}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <p className="text-gray-500 text-lg mb-4">Your feed is empty</p>
              <p className="text-gray-400 mb-6">
                Subscribe to confessions to see their posts here
              </p>
              <button
                onClick={() => setView('confessions')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Confessions
              </button>
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
      )}
    </div>
  )
}

export default Home