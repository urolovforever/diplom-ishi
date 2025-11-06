import React, { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaUserCircle, FaHeart, FaComment, FaUsers } from 'react-icons/fa';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api/notification';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const NotificationsSidebar = ({ isOpen, onClose, onNotificationsRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.results || data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
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
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
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
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Notifications</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Mark all read button */}
        {notifications.some(n => !n.is_read) && (
          <div className="p-4 border-b">
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FaUserCircle size={48} className="mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition ${
                    notification.is_read
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-blue-50 hover:bg-blue-100'
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
                          <FaUserCircle className="w-6 h-6 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          @{notification.actor.username}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-sm text-gray-700 mb-1">
                        {notification.message}
                      </p>

                      {/* Confession name */}
                      <p className="text-xs text-gray-500 mb-1">
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
    </>
  );
};

export default NotificationsSidebar;
