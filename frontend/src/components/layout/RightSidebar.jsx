import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { confessionAPI } from '../../api/confession'
import { useAuthStore } from '../../store/authStore'
import { FiClock, FiUsers } from 'react-icons/fi'

const RightSidebar = () => {
  const { user } = useAuthStore()
  const [activeConfessions, setActiveConfessions] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [subscribedIds, setSubscribedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState({})

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      const confessionsData = await confessionAPI.getConfessions({ page_size: 100 })
      const allConfessions = confessionsData.results || confessionsData

      if (user) {
        // Get user subscriptions
        const subsData = await confessionAPI.getSubscriptions()
        const subIds = subsData.map ? subsData.map(s => s.confession.id) : (subsData.results || []).map(s => s.confession.id)
        setSubscribedIds(subIds)

        // Active: subscribed confessions
        const subscribedConfessions = allConfessions.filter(c => subIds.includes(c.id))
        setActiveConfessions(subscribedConfessions.slice(0, 5))

        // Suggestions: ALL unsubscribed confessions sorted by followers
        const unsubscribed = allConfessions.filter(c => !subIds.includes(c.id))
        unsubscribed.sort((a, b) => (b.subscribers_count || 0) - (a.subscribers_count || 0))
        setSuggestions(unsubscribed)
      } else {
        // For guests: show top confessions
        const sorted = [...allConfessions].sort((a, b) => (b.subscribers_count || 0) - (a.subscribers_count || 0))
        setActiveConfessions(sorted.slice(0, 5))
        setSuggestions(sorted.slice(5, 10))
      }
    } catch (error) {
      console.error('Failed to fetch sidebar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (e, confession) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.error('Please login to subscribe')
      return
    }

    setSubscribing({ ...subscribing, [confession.id]: true })

    try {
      await confessionAPI.subscribe(confession.slug)
      toast.success(`Subscribed to ${confession.name}!`)
      // Refresh data
      await fetchData()
    } catch (error) {
      toast.error('Failed to subscribe')
    } finally {
      setSubscribing({ ...subscribing, [confession.id]: false })
    }
  }

  const SidebarCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
      <div className="flex items-center space-x-2 mb-4">
        <Icon className="text-gray-600 dark:text-gray-400" size={20} />
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      </div>
      {children}
    </div>
  )

  const ConfessionItem = ({ confession, showButton = false }) => (
    <Link
      to={`/confession/${confession.slug}`}
      className="flex items-center space-x-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2 transition-colors group"
    >
      {confession.logo ? (
        <img
          src={confession.logo}
          alt={confession.name}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">{confession.name[0]}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
          {confession.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {confession.subscribers_count || 0} followers
        </p>
      </div>
      {showButton && user && (
        <button
          onClick={(e) => handleFollow(e, confession)}
          disabled={subscribing[confession.id]}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50"
        >
          {subscribing[confession.id] ? '...' : 'Follow'}
        </button>
      )}
    </Link>
  )

  if (loading) {
    return (
      <div className="fixed right-0 top-0 h-screen w-96 bg-gray-50 dark:bg-gray-950 p-5">
        <div className="animate-pulse space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl h-48"></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl h-48"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-gray-50 dark:bg-gray-950 overflow-y-auto p-5">
      {/* Active/My Confessions */}
      {user && activeConfessions.length > 0 && (
        <SidebarCard title="My Confessions" icon={FiClock}>
          <div className="space-y-1">
            {activeConfessions.map((confession) => (
              <ConfessionItem key={confession.id} confession={confession} />
            ))}
          </div>
        </SidebarCard>
      )}

      {/* Suggestions */}
      <SidebarCard title="Suggestions For You" icon={FiUsers}>
        <div className="space-y-1">
          {suggestions.length > 0 ? (
            suggestions.map((confession) => (
              <ConfessionItem key={confession.id} confession={confession} showButton />
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
              {user ? 'No more suggestions' : 'Login to get personalized suggestions'}
            </p>
          )}
        </div>
      </SidebarCard>

      {/* Footer */}
      <div className="mt-6 px-2 pb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <div className="flex flex-wrap gap-2">
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">About</a>
            <span>·</span>
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Help</a>
            <span>·</span>
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy</a>
            <span>·</span>
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Terms</a>
          </div>
          <p className="text-gray-400 dark:text-gray-500">© 2025 Religion Platform</p>
        </div>
      </div>
    </div>
  )
}

export default RightSidebar
