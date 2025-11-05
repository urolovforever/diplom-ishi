import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import MainLayout from '../components/layout/MainLayout'
import ConfessionsStories from '../components/ConfessionsStories'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'

const Home = () => {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConfession, setSelectedConfession] = useState(null)

  useEffect(() => {
    fetchPosts()
  }, [user, selectedConfession])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      let data
      if (selectedConfession) {
        // Fetch posts from specific confession
        data = await confessionAPI.getPosts({ confession: selectedConfession })
      } else if (user) {
        // Fetch user's feed (subscribed confessions)
        data = await confessionAPI.getFeed()
      } else {
        // Fetch all posts for guests
        data = await confessionAPI.getPosts()
      }
      setPosts(data.results || data)
    } catch (error) {
      toast.error('Failed to load posts')
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

  if (loading) return (
    <MainLayout>
      <Loading />
    </MainLayout>
  )

  return (
    <MainLayout>
      {/* Confessions Stories */}
      <ConfessionsStories onConfessionSelect={setSelectedConfession} />

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg mb-2">No posts to show</p>
            <p className="text-gray-400 text-sm">
              {user
                ? 'Subscribe to confessions to see their posts here'
                : 'Login to see your personalized feed'}
            </p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onUnlike={handleUnlike}
              onDelete={handlePostDelete}
              isConfessionAdmin={user && post.confession.admin?.id === user.id}
            />
          ))
        )}
      </div>
    </MainLayout>
  )
}

export default Home