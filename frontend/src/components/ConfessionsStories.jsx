import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { confessionAPI } from '../api/confession'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { useLanguage } from '../contexts/LanguageContext'

const ConfessionsStories = ({ onConfessionSelect }) => {
  const { t } = useLanguage()
  const [confessions, setConfessions] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConfession, setSelectedConfession] = useState(null)
  const scrollRef = useRef(null)
  const { user } = useAuthStore()

  useEffect(() => {
    fetchConfessions()
  }, [user])

  const fetchConfessions = async () => {
    try {
      if (user) {
        // For logged in users, only show subscribed confessions
        const subsData = await confessionAPI.getSubscriptions()
        const subscriptionsList = subsData.results || subsData

        if (!subscriptionsList || subscriptionsList.length === 0) {
          setConfessions([])
          setSubscriptions([])
        } else {
          const subscribedConfessions = subscriptionsList.map(s => s.confession)
          setConfessions(subscribedConfessions)
          setSubscriptions(subscribedConfessions.map(c => c.id))
        }
      } else {
        // For guests, show all confessions
        const data = await confessionAPI.getConfessions()
        setConfessions(data.results || data)
      }
    } catch (error) {
      console.error('Failed to fetch confessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScroll = (direction) => {
    const container = scrollRef.current
    if (container) {
      const scrollAmount = 300
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const handleConfessionClick = (confession) => {
    setSelectedConfession(confession.id === selectedConfession ? null : confession.id)
    if (onConfessionSelect) {
      onConfessionSelect(confession.id === selectedConfession ? null : confession.id)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex space-x-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center space-y-2 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 relative">
      {/* Empty State Message */}
      {user && confessions.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            {t('home.noSubscriptionsYet')}
          </p>
          <Link
            to="/explore"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold"
          >
            {t('home.exploreConfessionsLink')}
          </Link>
        </div>
      )}

      {/* Navigation Buttons */}
      {confessions.length > 6 && (
        <>
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <FiChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <FiChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </>
      )}

      {/* Confessions Carousel */}
      {confessions.length > 0 && (
        <div
          ref={scrollRef}
          className="flex space-x-6 overflow-x-auto scrollbar-hide scroll-smooth px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All Posts Option */}
          {user && (
            <button
              onClick={() => handleConfessionClick({ id: null })}
              className="flex flex-col items-center flex-shrink-0 space-y-2"
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  selectedConfession === null
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-110'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-white font-bold text-xl">{t('home.all')}</span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium text-center w-20 truncate">
                {t('home.allPosts')}
              </span>
            </button>
          )}

          {/* Confessions */}
          {confessions.map((confession) => {
          const isSubscribed = subscriptions.includes(confession.id)
          const isSelected = selectedConfession === confession.id

          return (
            <button
              key={confession.id}
              onClick={() => handleConfessionClick(confession)}
              className="flex flex-col items-center flex-shrink-0 space-y-2 group"
            >
              <div
                className={`w-16 h-16 rounded-full p-0.5 transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-110'
                    : isSubscribed
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500'
                    : 'bg-gray-300 dark:bg-gray-700'
                } ${!isSelected && 'group-hover:scale-105'}`}
              >
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                  {confession.logo ? (
                    <img
                      src={confession.logo}
                      alt={confession.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {confession.name[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium text-center w-20 truncate">
                {confession.name}
              </span>
            </button>
          )
        })}
        </div>
      )}

    </div>
  )
}

export default ConfessionsStories
