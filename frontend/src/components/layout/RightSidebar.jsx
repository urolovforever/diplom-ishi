import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { confessionAPI } from '../../api/confession'
import { FiTrendingUp, FiClock, FiUsers } from 'react-icons/fi'

const RightSidebar = () => {
  const [activeConfessions, setActiveConfessions] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch all confessions for now
      const confessionsData = await confessionAPI.getConfessions()

      // Mock active confessions (last 24 hours activity)
      setActiveConfessions(confessionsData.results?.slice(0, 5) || [])

      // Mock suggestions
      setSuggestions(confessionsData.results?.slice(5, 10) || [])
    } catch (error) {
      console.error('Failed to fetch sidebar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const SidebarCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-center space-x-2 mb-4">
        <Icon className="text-gray-600" size={20} />
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  )

  const ConfessionItem = ({ confession, showButton = false }) => (
    <Link
      to={`/confession/${confession.slug}`}
      className="flex items-center space-x-3 py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors"
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
        <p className="text-sm font-semibold text-gray-800 truncate">
          {confession.name}
        </p>
        <p className="text-xs text-gray-500">
          {confession.subscribers_count || 0} subscribers
        </p>
      </div>
      {showButton && (
        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1 rounded-full hover:bg-blue-50">
          Follow
        </button>
      )}
    </Link>
  )

  if (loading) {
    return (
      <div className="fixed right-0 top-0 h-screen w-96 bg-gray-50 p-5">
        <div className="animate-pulse space-y-4">
          <div className="bg-white rounded-xl h-48"></div>
          <div className="bg-white rounded-xl h-48"></div>
          <div className="bg-white rounded-xl h-48"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-gray-50 overflow-y-auto p-5">
      {/* Active Confessions */}
      <SidebarCard title="Active Confessions" icon={FiClock}>
        <div className="space-y-1">
          {activeConfessions.length > 0 ? (
            activeConfessions.map((confession) => (
              <ConfessionItem key={confession.id} confession={confession} />
            ))
          ) : (
            <p className="text-sm text-gray-500 py-2">No active confessions</p>
          )}
        </div>
      </SidebarCard>

      {/* Trending Topics */}
      <SidebarCard title="Trending Topics" icon={FiTrendingUp}>
        <div className="space-y-3">
          <div className="hover:bg-gray-50 rounded-lg px-2 py-2 cursor-pointer transition-colors">
            <p className="text-sm font-semibold text-gray-800">#Peace</p>
            <p className="text-xs text-gray-500">1.2K posts</p>
          </div>
          <div className="hover:bg-gray-50 rounded-lg px-2 py-2 cursor-pointer transition-colors">
            <p className="text-sm font-semibold text-gray-800">#Unity</p>
            <p className="text-xs text-gray-500">856 posts</p>
          </div>
          <div className="hover:bg-gray-50 rounded-lg px-2 py-2 cursor-pointer transition-colors">
            <p className="text-sm font-semibold text-gray-800">#Tolerance</p>
            <p className="text-xs text-gray-500">642 posts</p>
          </div>
          <div className="hover:bg-gray-50 rounded-lg px-2 py-2 cursor-pointer transition-colors">
            <p className="text-sm font-semibold text-gray-800">#Interfaith</p>
            <p className="text-xs text-gray-500">523 posts</p>
          </div>
        </div>
      </SidebarCard>

      {/* Suggestions */}
      <SidebarCard title="Suggestions For You" icon={FiUsers}>
        <div className="space-y-1">
          {suggestions.length > 0 ? (
            suggestions.map((confession) => (
              <ConfessionItem key={confession.id} confession={confession} showButton />
            ))
          ) : (
            <p className="text-sm text-gray-500 py-2">No suggestions available</p>
          )}
        </div>
      </SidebarCard>

      {/* Footer */}
      <div className="mt-6 px-2 pb-4">
        <div className="text-xs text-gray-500 space-y-2">
          <div className="flex flex-wrap gap-2">
            <a href="#" className="hover:text-gray-700">About</a>
            <span>·</span>
            <a href="#" className="hover:text-gray-700">Help</a>
            <span>·</span>
            <a href="#" className="hover:text-gray-700">Privacy</a>
            <span>·</span>
            <a href="#" className="hover:text-gray-700">Terms</a>
          </div>
          <p className="text-gray-400">© 2025 Religion Platform</p>
        </div>
      </div>
    </div>
  )
}

export default RightSidebar
