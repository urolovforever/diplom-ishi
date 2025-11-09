import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  FiHome,
  FiCompass,
  FiMessageCircle,
  FiBell,
  FiPlusSquare,
  FiUser,
  FiLogOut,
  FiSettings,
  FiArrowLeft,
  FiMoreHorizontal,
  FiMoon,
  FiSun,
  FiGlobe,
  FiMenu
} from 'react-icons/fi'
import { FaUserCircle, FaHeart, FaComment, FaUsers } from 'react-icons/fa'
import { getUnreadCount, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../api/notification'
import messagingAPI from '../../api/messaging'
import { toast } from 'react-toastify'
import { formatUsername, formatRelativeTime } from '../../utils/formatters'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'

const LeftSidebar = () => {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const { darkMode, toggleDarkMode } = useTheme()
  const { language, changeLanguage: setLanguage, t } = useLanguage()

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const data = await getUnreadCount()
          setUnreadCount(data.count)
        } catch (error) {
          console.error('Failed to fetch unread count:', error)
        }
      }
    }

    const fetchUnreadMessagesCount = async () => {
      if (user) {
        try {
          const data = await messagingAPI.getUnreadCount()
          setUnreadMessagesCount(data.unread_count)
        } catch (error) {
          console.error('Failed to fetch unread messages count:', error)
        }
      }
    }

    fetchUnreadCount()
    fetchUnreadMessagesCount()

    // Poll for new notifications and messages every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchUnreadMessagesCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMoreMenu && !event.target.closest('.more-menu-container')) {
        setShowMoreMenu(false)
      }
      if (showMobileMenu && !event.target.closest('.mobile-menu-container')) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMoreMenu, showMobileMenu])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDarkModeToggle = () => {
    toggleDarkMode()
    setShowMoreMenu(false)
    setShowMobileMenu(false)
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setShowMoreMenu(false)
    setShowMobileMenu(false)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleNotificationsClick = async () => {
    setShowNotifications(true)
    setLoadingNotifications(true)
    setShowMobileMenu(false)
    try {
      const data = await getNotifications()
      setNotifications(data.results || data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error(t('notifications.failedToLoad'))
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleBackClick = () => {
    setShowNotifications(false)
  }

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id)
        setNotifications(notifications.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        ))
        // Refresh unread count
        const data = await getUnreadCount()
        setUnreadCount(data.count)
      }

      // Navigate to the link
      if (notification.link) {
        navigate(notification.link)
        setShowNotifications(false)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      // Refresh unread count
      const data = await getUnreadCount()
      setUnreadCount(data.count)
      toast.success(t('notifications.allMarkedRead'))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      toast.error(t('notifications.markAllReadFailed'))
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'subscribe':
        return <FaUsers className="text-blue-500" size={20} />
      case 'like':
        return <FaHeart className="text-red-500" size={20} />
      case 'comment':
        return <FaComment className="text-green-500" size={20} />
      case 'comment_like':
        return <FaHeart className="text-pink-500" size={20} />
      case 'comment_reply':
        return <FaComment className="text-purple-500" size={20} />
      default:
        return <FaUserCircle className="text-gray-500" size={20} />
    }
  }

  // Generate translated notification message
  const getNotificationMessage = (notification) => {
    const actorUsername = notification.actor.username;
    const postTitle = notification.post?.title || '';

    let translatedMessage = '';
    switch (notification.notification_type) {
      case 'subscribe':
        translatedMessage = t('notifications.subscribed', { username: actorUsername });
        break;
      case 'like':
        translatedMessage = t('notifications.likedPost', { username: actorUsername, title: postTitle });
        break;
      case 'comment':
        translatedMessage = t('notifications.commentedPost', { username: actorUsername, title: postTitle });
        break;
      case 'comment_like':
        translatedMessage = t('notifications.likedComment', { username: actorUsername, title: postTitle });
        break;
      case 'comment_reply':
        translatedMessage = t('notifications.repliedComment', { username: actorUsername, title: postTitle });
        break;
      default:
        translatedMessage = t('notifications.interacted', { username: actorUsername });
    }

    return translatedMessage;
  };

  const NavItem = ({ to, icon: Icon, label, onClick, badge, mobileOnly }) => {
    const handleClick = () => {
      setShowMobileMenu(false)
      if (onClick) {
        onClick()
      } else if (to) {
        navigate(to)
      }
    }

    const content = (
      <>
        <div className="relative">
          <Icon size={26} className="lg:w-[26px] lg:h-[26px] w-6 h-6" />
          {badge > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>
        <span className="text-base font-medium hidden lg:inline">{label}</span>
      </>
    )

    const className = `flex items-center space-x-4 px-5 py-3.5 rounded-xl transition-all duration-200 relative w-full text-left ${
      to && isActive(to)
        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    } ${mobileOnly ? 'lg:hidden' : ''}`

    return (
      <button onClick={handleClick} className={className}>
        {content}
      </button>
    )
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 px-6 py-6 no-underline">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">RP</span>
          </div>
          <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Religion<br />Platform
          </span>
        </Link>

        {/* Navigation or Notifications View */}
        {!showNotifications ? (
          // Regular Navigation
          <nav className="flex-1 px-4 py-6 space-y-1">
            <NavItem to="/" icon={FiHome} label={t('nav.home')} />
            <NavItem to="/explore" icon={FiCompass} label={t('nav.explore')} />

            {user && (
              <>
                <NavItem to="/messages" icon={FiMessageCircle} label={t('nav.messages')} badge={unreadMessagesCount} />

                <NavItem
                  icon={FiBell}
                  label={t('nav.notifications')}
                  onClick={handleNotificationsClick}
                  badge={unreadCount}
                />

                {user.role === 'admin' && (
                  <NavItem to="/create" icon={FiPlusSquare} label={t('nav.create')} />
                )}

                <NavItem to="/profile" icon={FiUser} label={t('nav.profile')} />

                {user.role === 'superadmin' && (
                  <NavItem to="/admin" icon={FiSettings} label={t('nav.admin')} />
                )}
              </>
            )}
          </nav>
        ) : (
          // Notifications View
          <div className="flex-1 flex flex-col min-h-0">
            {/* Back Button */}
            <div className="px-4 py-4 flex-shrink-0">
              <button
                onClick={handleBackClick}
                className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <FiArrowLeft size={24} />
                <span className="text-lg font-semibold">{t('nav.notifications')}</span>
              </button>
            </div>

            {/* Mark all read button */}
            {notifications.some(n => !n.is_read) && (
              <div className="px-4 py-3 flex-shrink-0">
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  {t('common.markAllRead')}
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingNotifications ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 px-4">
                  <FaUserCircle size={48} className="mb-4 opacity-50" />
                  <p>{t('common.noNotifications')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-800 relative ${
                        notification.is_read ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.notification_type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Actor info */}
                          <div
                            className="flex items-center space-x-2 mb-1 cursor-pointer hover:opacity-70"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/user/${notification.actor.username}`)
                              setShowNotifications(false)
                            }}
                          >
                            {notification.actor.avatar ? (
                              <img
                                src={notification.actor.avatar}
                                alt={notification.actor.username}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <FaUserCircle className="w-6 h-6 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-blue-600 hover:text-blue-700 truncate">
                              @{formatUsername(notification.actor.username)}
                            </span>
                          </div>

                          {/* Message */}
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1 line-clamp-2">
                            {getNotificationMessage(notification)}
                          </p>

                          {/* Confession name (if available) */}
                          {notification.confession && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
                              {t('notifications.in')} {notification.confession.name}
                            </p>
                          )}

                          {/* Time */}
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {formatRelativeTime(notification.created_at, language)}
                          </p>

                          {/* Unread indicator */}
                          {!notification.is_read && (
                            <div className="absolute top-4 right-4">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* User section */}
        {user ? (
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 relative more-menu-container">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">{formatUsername(user.username)[0].toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatUsername(user.username)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiMoreHorizontal size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* More Menu Dropdown */}
            {showMoreMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                {/* Dark Mode Toggle */}
                <button
                  onClick={handleDarkModeToggle}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {darkMode ? <FiSun size={20} className="text-yellow-500" /> : <FiMoon size={20} className="text-indigo-600" />}
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {darkMode ? t('settings.lightMode') : t('settings.darkMode')}
                    </span>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'} relative`}>
                    <div className={`absolute top-1 ${darkMode ? 'right-1' : 'left-1'} w-4 h-4 bg-white rounded-full transition-all`}></div>
                  </div>
                </button>

                {/* Language Selector */}
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <FiGlobe size={18} className="text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('settings.language')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: 'en', label: 'English', flag: '🇬🇧' },
                      { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' },
                      { code: 'ru', label: 'Русский', flag: '🇷🇺' }
                    ].map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                          language === lang.code
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className="text-2xl mb-1">{lang.flag}</span>
                        <span className="text-xs font-medium">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400"
                >
                  <FiLogOut size={20} />
                  <span className="text-sm font-medium">{t('settings.logout')}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <Link
              to="/login"
              className="block w-full px-4 py-3 text-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium no-underline"
            >
              {t('auth.login')}
            </Link>
            <Link
              to="/register"
              className="block w-full px-4 py-3 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium no-underline"
            >
              {t('auth.register')}
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center p-2 rounded-lg no-underline ${
              isActive('/') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <FiHome size={24} />
            <span className="text-xs mt-1">{t('nav.home')}</span>
          </Link>

          <Link
            to="/explore"
            className={`flex flex-col items-center justify-center p-2 rounded-lg no-underline ${
              isActive('/explore') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <FiCompass size={24} />
            <span className="text-xs mt-1">{t('nav.explore')}</span>
          </Link>

          {user && user.role === 'admin' && (
            <Link
              to="/create"
              className="flex flex-col items-center justify-center p-2 rounded-lg text-blue-600 dark:text-blue-400 no-underline"
            >
              <FiPlusSquare size={28} />
            </Link>
          )}

          {user && (
            <>
              <button
                onClick={handleNotificationsClick}
                className={`flex flex-col items-center justify-center p-2 rounded-lg relative ${
                  showNotifications ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <FiBell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span className="text-xs mt-1">{t('nav.notifications')}</span>
              </button>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg mobile-menu-container ${
                  showMobileMenu ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <FiMenu size={24} />
                <span className="text-xs mt-1">{t('nav.more')}</span>
              </button>
            </>
          )}

          {!user && (
            <Link
              to="/profile"
              className="flex flex-col items-center justify-center p-2 rounded-lg text-gray-600 dark:text-gray-400 no-underline"
            >
              <FiUser size={24} />
              <span className="text-xs mt-1">{t('nav.profile')}</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && user && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* User Info */}
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">{formatUsername(user.username)[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatUsername(user.username)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>

              {/* Nav Links */}
              <div className="p-2">
                <Link
                  to="/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors no-underline text-gray-700 dark:text-gray-300"
                >
                  <FiUser size={20} />
                  <span className="text-sm font-medium">{t('nav.profile')}</span>
                </Link>

                <Link
                  to="/messages"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors no-underline text-gray-700 dark:text-gray-300 relative"
                >
                  <FiMessageCircle size={20} />
                  <span className="text-sm font-medium">{t('nav.messages')}</span>
                  {unreadMessagesCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>

                {user.role === 'superadmin' && (
                  <Link
                    to="/admin"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors no-underline text-gray-700 dark:text-gray-300"
                  >
                    <FiSettings size={20} />
                    <span className="text-sm font-medium">{t('nav.admin')}</span>
                  </Link>
                )}
              </div>

              {/* Settings */}
              <div className="p-2">
                <button
                  onClick={handleDarkModeToggle}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {darkMode ? <FiSun size={20} className="text-yellow-500" /> : <FiMoon size={20} className="text-indigo-600" />}
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {darkMode ? t('settings.lightMode') : t('settings.darkMode')}
                    </span>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'} relative`}>
                    <div className={`absolute top-1 ${darkMode ? 'right-1' : 'left-1'} w-4 h-4 bg-white rounded-full transition-all`}></div>
                  </div>
                </button>
              </div>

              {/* Language */}
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FiGlobe size={18} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('settings.language')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'en', label: 'English', flag: '🇬🇧' },
                    { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' },
                    { code: 'ru', label: 'Русский', flag: '🇷🇺' }
                  ].map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                        language === lang.code
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-1">{lang.flag}</span>
                      <span className="text-xs font-medium">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout */}
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowMobileMenu(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
                >
                  <FiLogOut size={20} />
                  <span className="text-sm font-medium">{t('settings.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Notifications Panel */}
      {showNotifications && (
        <div className="lg:hidden fixed inset-0 bg-white dark:bg-gray-900 z-[60] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBackClick}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <FiArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('nav.notifications')}</h1>
            <div className="w-10"></div>
          </div>

          {/* Mark all read button */}
          {notifications.some(n => !n.is_read) && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {t('common.markAllRead')}
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loadingNotifications ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 px-4">
                <FaUserCircle size={48} className="mb-4 opacity-50" />
                <p>{t('common.noNotifications')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition active:bg-gray-100 dark:active:bg-gray-800 relative ${
                      notification.is_read ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Actor info */}
                        <div
                          className="flex items-center space-x-2 mb-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/user/${notification.actor.username}`)
                            setShowNotifications(false)
                          }}
                        >
                          {notification.actor.avatar ? (
                            <img
                              src={notification.actor.avatar}
                              alt={notification.actor.username}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <FaUserCircle className="w-6 h-6 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-700 truncate">
                            @{formatUsername(notification.actor.username)}
                          </span>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1 line-clamp-2">
                          {getNotificationMessage(notification)}
                        </p>

                        {/* Confession name */}
                        {notification.confession && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
                            {t('notifications.in')} {notification.confession.name}
                          </p>
                        )}

                        {/* Time */}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatRelativeTime(notification.created_at, language)}
                        </p>

                        {/* Unread indicator */}
                        {!notification.is_read && (
                          <div className="absolute top-4 right-4">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default LeftSidebar
