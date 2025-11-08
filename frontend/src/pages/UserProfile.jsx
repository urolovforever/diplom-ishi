import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authAPI } from '../api/auth'
import { confessionAPI } from '../api/confession'
import messagingAPI from '../api/messaging'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import MainLayout from '../components/layout/MainLayout'
import Loading from '../components/Loading'
import { FiArrowLeft, FiMail, FiUser, FiMessageCircle } from 'react-icons/fi'

const UserProfile = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const { darkMode } = useTheme()
  const { t } = useLanguage()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState([])
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    fetchUser()
    if (currentUser) {
      fetchSubscriptions()
    }
  }, [username, currentUser])

  const fetchUser = async () => {
    setLoading(true)
    try {
      const userData = await authAPI.getUserProfile(username)
      setUser(userData)
    } catch (error) {
      toast.error(t('userProfile.failedToLoadProfile'))
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const data = await confessionAPI.getSubscriptions()
      const subscriptionsList = data.results || data
      setSubscriptions(subscriptionsList)
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    }
  }

  const handleSendMessage = async (confessionId) => {
    if (!currentUser) {
      toast.error(t('userProfile.pleaseLoginToMessage'))
      navigate('/login')
      return
    }

    setSendingMessage(true)
    try {
      // Get or create conversation with this admin for the specific confession
      const conversation = await messagingAPI.getOrCreateConversation(user.id, confessionId)

      // Navigate to the conversation
      navigate(`/messages/${conversation.id}`)
      toast.success(t('userProfile.openingConversation'))
    } catch (error) {
      console.error('Failed to create conversation:', error)
      toast.error(t('userProfile.failedToOpenConversation'))
    } finally {
      setSendingMessage(false)
    }
  }

  // Check if user can send message to this confession admin
  const canSendMessage = (confessionId) => {
    if (!currentUser || !user) return false
    if (currentUser.id === user.id) return false // Can't message yourself

    // Check if current user is subscribed to this confession
    return subscriptions.some(sub => sub.confession.id === confessionId)
  }

  if (loading) return (
    <MainLayout>
      <Loading />
    </MainLayout>
  )

  if (!user) return (
    <MainLayout>
      <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-800'}`}>{t('userProfile.userNotFound')}</div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/"
          className={`inline-flex items-center space-x-2 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} mb-6`}
        >
          <FiArrowLeft />
          <span>{t('userProfile.backToHome')}</span>
        </Link>

        {/* Profile Card */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden`}>
          {/* Header with Avatar */}
          <div className={`${darkMode ? 'bg-gradient-to-r from-blue-700 to-purple-700' : 'bg-gradient-to-r from-blue-500 to-purple-600'} h-32`}></div>
          <div className="px-8 pb-8">
            <div className="flex flex-col items-center -mt-16">
              {/* Avatar */}
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className={`w-32 h-32 rounded-full border-4 ${darkMode ? 'border-gray-800' : 'border-white'} object-cover shadow-lg`}
                  />
                ) : (
                  <div className={`w-32 h-32 rounded-full border-4 ${darkMode ? 'border-gray-800 bg-gradient-to-r from-blue-700 to-purple-700' : 'border-white bg-gradient-to-r from-blue-500 to-purple-600'} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-4xl">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="mt-6 text-center">
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'} mb-2`}>
                  {user.username}
                </h1>
                <div className={`flex items-center justify-center space-x-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  <FiMail size={18} />
                  <span>{user.email}</span>
                </div>
                <div className={`inline-flex items-center space-x-2 px-4 py-2 ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-600'} rounded-full`}>
                  <FiUser size={16} />
                  <span className="font-medium capitalize">{user.role}</span>
                </div>
              </div>

              {/* Message Buttons for Confession Admins */}
              {user.managed_confessions && user.managed_confessions.length > 0 && currentUser && (
                <div className="mt-6 w-full max-w-2xl">
                  <div className={`${darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'} rounded-lg p-6 border`}>
                    <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-3 flex items-center`}>
                      <FiMessageCircle className="mr-2" />
                      {t('userProfile.sendMessageToAdmin')}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                      {t('userProfile.canSendMessage')}
                    </p>
                    <div className="space-y-2">
                      {user.managed_confessions.map((confession) => (
                        <div key={confession.id} className={`flex items-center justify-between ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg p-3 border`}>
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{confession.name}</p>
                            {canSendMessage(confession.id) ? (
                              <p className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>✓ {t('userProfile.youAreSubscribed')}</p>
                            ) : (
                              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('userProfile.subscribeToSendMessages')}</p>
                            )}
                          </div>
                          {canSendMessage(confession.id) && (
                            <button
                              onClick={() => handleSendMessage(confession.id)}
                              disabled={sendingMessage}
                              className={`px-4 py-2 ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <FiMessageCircle size={16} />
                              <span>{sendingMessage ? t('userProfile.opening') : t('userProfile.message')}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bio Section */}
              {user.bio && (
                <div className="mt-6 w-full max-w-2xl">
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}>
                    <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>{t('userProfile.bio')}</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>{user.bio}</p>
                  </div>
                </div>
              )}

              {/* Stats Section */}
              <div className="mt-8 w-full max-w-2xl">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}>
                  <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-4`}>{t('userProfile.profileInformation')}</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{t('userProfile.username')}</p>
                      <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{user.username}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{t('userProfile.email')}</p>
                      <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{user.email}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{t('userProfile.role')}</p>
                      <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'} capitalize`}>{user.role}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{t('userProfile.memberSince')}</p>
                      <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        {new Date(user.date_joined).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default UserProfile
