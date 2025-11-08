import React, { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaUserCircle, FaHeart, FaComment, FaUsers } from 'react-icons/fa';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api/notification';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { formatRelativeTime } from '../utils/formatters';

const NotificationsSidebar = ({ isOpen, onClose, onNotificationsRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

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

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      const notificationsList = data.results || data;
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error(t('notifications.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
        setNotifications(notifications.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        onNotificationsRead();
      }

      // Navigate to the link
      if (notification.link) {
        navigate(notification.link);
        onClose();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      onNotificationsRead();
      toast.success(t('notifications.allMarkedRead'));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error(t('notifications.markAllReadFailed'));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'subscribe':
        return <FaUsers className="text-blue-500" />;
      case 'like':
        return <FaHeart className="text-red-500" />;
      case 'comment':
        return <FaComment className="text-green-500" />;
      default:
        return <FaUserCircle className="text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('nav.notifications')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition text-gray-800 dark:text-gray-100"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Mark all read button */}
        {notifications.some(n => !n.is_read) && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-500 font-medium"
            >
              {t('common.markAllRead')}
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <FaUserCircle size={48} className="mb-4 opacity-50" />
              <p>{t('common.noNotifications')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition ${
                    notification.is_read
                      ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      : 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Actor avatar */}
                      <div className="flex items-center space-x-2 mb-1">
                        {notification.actor.avatar ? (
                          <img
                            src={notification.actor.avatar}
                            alt={notification.actor.username}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <FaUserCircle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          @{notification.actor.username}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {getNotificationMessage(notification)}
                      </p>

                      {/* Confession name */}
                      {notification.confession && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
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
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
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
    </>
  );
};

export default NotificationsSidebar;
