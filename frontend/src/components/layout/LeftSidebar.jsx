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
  FiArrowLeft
} from 'react-icons/fi'
import { FaUserCircle, FaHeart, FaComment, FaUsers } from 'react-icons/fa'
import { getUnreadCount, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../api/notification'
import { toast } from 'react-toastify'

const LeftSidebar = () => {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        try {
          const data = await getUnreadCount()
          setUnreadCount(data.count)
        } catch (error) {
          console.error('Failed to fetch unread count:', error)
        }
      }
    }

    fetchUnreadCount()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleNotificationsClick = async () => {
    setShowNotifications(true)
    setLoadingNotifications(true)
    try {
      const data = await getNotifications()
      setNotifications(data.results || data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error('Failed to load notifications')
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
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      toast.error('Failed to mark all as read')
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
      default:
        return <FaUserCircle className="text-gray-500" size={20} />
    }
  }

  const NavItem = ({ to, icon: Icon, label, onClick, badge, isButton }) => {
    const content = (
      <>
        <div className="relative">
          <Icon size={26} />
          {badge > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>
        <span className="text-base font-medium">{label}</span>
      </>
    )

    const className = `flex items-center space-x-4 px-5 py-3.5 rounded-xl transition-all duration-200 relative ${
      !isButton && isActive(to)
        ? 'bg-blue-50 text-blue-600 font-semibold'
        : 'text-gray-700 hover:bg-gray-100'
    } ${isButton ? 'w-full text-left' : ''}`

    if (isButton) {
      return (
        <button onClick={onClick} className={className}>
          {content}
        </button>
      )
    }

    return (
      <Link to={to} onClick={onClick} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <Link to="/" className="flex items-center space-x-3 px-6 py-6 border-b border-gray-200">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-2xl">RP</span>
        </div>
        <span className="text-xl font-bold text-gray-800">
          Religion<br />Platform
        </span>
      </Link>

      {/* Navigation or Notifications View */}
      {!showNotifications ? (
        // Regular Navigation
        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavItem to="/" icon={FiHome} label="Home" />
          <NavItem to="/explore" icon={FiCompass} label="Explore" />

          {user && (
            <>
              <NavItem to="/messages" icon={FiMessageCircle} label="Messages" />

              {(user.role === 'admin' || user.role === 'superadmin') && (
                <NavItem
                  icon={FiBell}
                  label="Notifications"
                  onClick={handleNotificationsClick}
                  badge={unreadCount}
                  isButton={true}
                />
              )}

              {user.role === 'admin' && (
                <NavItem to="/create" icon={FiPlusSquare} label="Create" />
              )}

              <NavItem to="/profile" icon={FiUser} label="Profile" />

              {user.role === 'superadmin' && (
                <NavItem to="/admin" icon={FiSettings} label="Admin Panel" />
              )}
            </>
          )}
        </nav>
      ) : (
        // Notifications View
        <div className="flex-1 flex flex-col">
          {/* Back Button */}
          <div className="px-4 py-4 border-b border-gray-200">
            <button
              onClick={handleBackClick}
              className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <FiArrowLeft size={24} />
              <span className="text-lg font-semibold">Notifications</span>
            </button>
          </div>

          {/* Mark all read button */}
          {notifications.some(n => !n.is_read) && (
            <div className="px-4 py-3 border-b border-gray-200">
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
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
              <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
                <FaUserCircle size={48} className="mb-4 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition hover:bg-gray-50 relative ${
                      notification.is_read ? 'bg-white' : 'bg-blue-50'
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
                        <div className="flex items-center space-x-2 mb-1">
                          {notification.actor.avatar ? (
                            <img
                              src={notification.actor.avatar}
                              alt={notification.actor.username}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <FaUserCircle className="w-6 h-6 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            @{notification.actor.username}
                          </span>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-700 mb-1 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Confession name */}
                        <p className="text-xs text-gray-500 mb-1 truncate">
                          in {notification.confession.name}
                        </p>

                        {/* Time */}
                        <p className="text-xs text-gray-400">
                          {notification.time_ago}
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
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">{user.username[0].toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{user.username}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-4 px-4 py-3 mt-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <FiLogOut size={26} />
            <span className="text-base font-medium">Logout</span>
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 border-t border-gray-200 space-y-2">
          <Link
            to="/login"
            className="block w-full px-4 py-3 text-center text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="block w-full px-4 py-3 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Register
          </Link>
        </div>
      )}
    </div>
  )
}

export default LeftSidebar
