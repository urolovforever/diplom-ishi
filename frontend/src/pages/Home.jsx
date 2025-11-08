import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import MainLayout from '../components/layout/MainLayout'
import ConfessionsStories from '../components/ConfessionsStories'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'
import { useLanguage } from '../contexts/LanguageContext'

const Home = () => {
  const { user } = useAuthStore()
  const { t } = useLanguage()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConfession, setSelectedConfession] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])

  // Fetch subscriptions to check if selected confession is still subscribed
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (user) {
        try {
          const data = await confessionAPI.getSubscriptions()
          const subscriptionsList = data.results || data
          setSubscriptions(subscriptionsList.map(s => s.confession.id))

          // If selected confession is not in subscriptions, reset it
          if (selectedConfession && !subscriptionsList.find(s => s.confession.id === selectedConfession)) {
            setSelectedConfession(null)
          }
        } catch (error) {
          console.error('Failed to fetch subscriptions:', error)
        }
      }
    }
    fetchSubscriptions()
  }, [user])

  useEffect(() => {
    fetchPosts()
  }, [user, selectedConfession])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      if (!user) {
        // No posts for guests - they need to login
        setPosts([])
        setLoading(false)
        return
      }

      let data
      if (selectedConfession) {
        // Fetch posts from specific confession
        data = await confessionAPI.getPosts({ confession: selectedConfession })
      } else {
        // Fetch user's feed (subscribed confessions)
        data = await confessionAPI.getFeed()
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
    if (!window.confirm(t('home.deletePostConfirm'))) {
      return
    }

    try {
      await confessionAPI.deletePost(postId)
      setPosts(posts.filter(post => post.id !== postId))
      toast.success(t('home.postDeleted'))
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
        {!user ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">🔒</div>
            <p className="text-gray-700 dark:text-gray-200 text-xl font-semibold mb-2">{t('home.loginRequired')}</p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {t('home.loginToViewPosts')}
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold"
            >
              {t('home.loginNow')}
            </Link>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{t('home.noPostsYet')}</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {t('home.subscribeToSeePosts')}
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