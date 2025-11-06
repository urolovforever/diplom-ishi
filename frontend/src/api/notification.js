import api from './axios';

/**
 * Notification API endpoints
 */

/**
 * Get all notifications for the current admin user
 */
export const getNotifications = async () => {
  const response = await api.get('/confessions/notifications/');
  return response.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
  const response = await api.get('/confessions/notifications/unread_count/');
  return response.data;
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  const response = await api.post(`/confessions/notifications/${notificationId}/mark_read/`);
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  const response = await api.post('/confessions/notifications/mark_all_read/');
  return response.data;
};
