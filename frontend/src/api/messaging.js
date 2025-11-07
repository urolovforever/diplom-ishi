import api from './axios';

/**
 * Messaging API endpoints
 */

const messagingAPI = {
  // Conversation endpoints
  getConversations: async () => {
    const response = await api.get('/messaging/conversations/');
    return response.data;
  },

  getConversation: async (conversationId) => {
    const response = await api.get(`/messaging/conversations/${conversationId}/`);
    return response.data;
  },

  createConversation: async (data) => {
    const response = await api.post('/messaging/conversations/', data);
    return response.data;
  },

  getOrCreateConversation: async (targetUserId, confessionId = null) => {
    const response = await api.post('/messaging/conversations/get_or_create/', {
      target_user_id: targetUserId,
      confession_id: confessionId,
    });
    return response.data;
  },

  markConversationAsRead: async (conversationId) => {
    const response = await api.post(`/messaging/conversations/${conversationId}/mark_as_read/`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/messaging/conversations/unread_count/');
    return response.data;
  },

  // Message endpoints
  getMessages: async (conversationId, page = 1) => {
    const response = await api.get('/messaging/messages/', {
      params: {
        conversation: conversationId,
        page: page,
      },
    });
    return response.data;
  },

  sendMessage: async (messageData) => {
    const formData = new FormData();

    formData.append('conversation', messageData.conversation);
    if (messageData.content) {
      formData.append('content', messageData.content);
    }
    if (messageData.reply_to) {
      formData.append('reply_to', messageData.reply_to);
    }

    // Append files if any
    if (messageData.attachment_files && messageData.attachment_files.length > 0) {
      messageData.attachment_files.forEach((file) => {
        formData.append('attachment_files', file);
      });
    }

    const response = await api.post('/messaging/messages/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  editMessage: async (messageId, content) => {
    const response = await api.patch(`/messaging/messages/${messageId}/`, {
      content: content,
    });
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messaging/messages/${messageId}/`);
    return response.data;
  },

  markMessageAsRead: async (messageId) => {
    const response = await api.post(`/messaging/messages/${messageId}/mark_as_read/`);
    return response.data;
  },

  pinMessage: async (messageId) => {
    const response = await api.post(`/messaging/messages/${messageId}/pin/`);
    return response.data;
  },

  unpinMessage: async (messageId) => {
    const response = await api.post(`/messaging/messages/${messageId}/unpin/`);
    return response.data;
  },
};

export default messagingAPI;
