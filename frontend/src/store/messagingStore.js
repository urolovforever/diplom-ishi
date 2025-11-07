import { create } from 'zustand';
import messagingAPI from '../api/messaging';

const useMessagingStore = create((set, get) => ({
  // State
  conversations: [],
  currentConversation: null,
  messages: {},
  unreadCount: 0,
  isLoading: false,
  error: null,
  wsConnections: {},
  typingUsers: {},
  onlineUsers: {},

  // Actions
  setConversations: (conversations) => set({ conversations }),

  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      const messageExists = existingMessages.some((m) => m.id === message.id);

      if (messageExists) {
        return state;
      }

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, message],
        },
      };
    }),

  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId]?.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      },
    })),

  removeMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId]?.filter(
          (msg) => msg.id !== messageId
        ),
      },
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setTypingUser: (conversationId, userId, isTyping) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: {
          ...(state.typingUsers[conversationId] || {}),
          [userId]: isTyping,
        },
      },
    })),

  setUserOnlineStatus: (userId, status) =>
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: status === 'online',
      },
    })),

  // API Actions
  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await messagingAPI.getConversations();
      set({ conversations: data.results || data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchMessages: async (conversationId, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const data = await messagingAPI.getMessages(conversationId, page);
      const messages = data.results || data;
      get().setMessages(conversationId, messages);
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  sendMessage: async (conversationId, content, attachmentFiles = [], replyToId = null) => {
    try {
      const messageData = {
        conversation: conversationId,
        content: content,
        attachment_files: attachmentFiles,
        reply_to: replyToId,
      };

      const message = await messagingAPI.sendMessage(messageData);

      // Message will be added via WebSocket, but we can add optimistically
      // get().addMessage(conversationId, message);

      return message;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  editMessage: async (conversationId, messageId, content) => {
    try {
      const updatedMessage = await messagingAPI.editMessage(messageId, content);
      get().updateMessage(conversationId, messageId, updatedMessage);
      return updatedMessage;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteMessage: async (conversationId, messageId) => {
    try {
      await messagingAPI.deleteMessage(messageId);
      get().removeMessage(conversationId, messageId);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  markMessageAsRead: async (messageId) => {
    try {
      await messagingAPI.markMessageAsRead(messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  },

  markConversationAsRead: async (conversationId) => {
    try {
      await messagingAPI.markConversationAsRead(conversationId);
      // Update local state
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        ),
      }));
      await get().fetchUnreadCount();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  },

  pinMessage: async (conversationId, messageId) => {
    try {
      const updatedMessage = await messagingAPI.pinMessage(messageId);
      get().updateMessage(conversationId, messageId, updatedMessage);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  unpinMessage: async (conversationId, messageId) => {
    try {
      const updatedMessage = await messagingAPI.unpinMessage(messageId);
      get().updateMessage(conversationId, messageId, updatedMessage);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await messagingAPI.getUnreadCount();
      set({ unreadCount: data.unread_count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  getOrCreateConversation: async (targetUserId, confessionId = null) => {
    set({ isLoading: true, error: null });
    try {
      const conversation = await messagingAPI.getOrCreateConversation(
        targetUserId,
        confessionId
      );
      set({ isLoading: false });
      return conversation;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // WebSocket connection management
  setWSConnection: (conversationId, connection) =>
    set((state) => ({
      wsConnections: {
        ...state.wsConnections,
        [conversationId]: connection,
      },
    })),

  removeWSConnection: (conversationId) =>
    set((state) => {
      const { [conversationId]: removed, ...rest } = state.wsConnections;
      return { wsConnections: rest };
    }),

  getWSConnection: (conversationId) => {
    return get().wsConnections[conversationId];
  },

  // Clear state
  clearMessages: (conversationId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [],
      },
    })),

  reset: () =>
    set({
      conversations: [],
      currentConversation: null,
      messages: {},
      unreadCount: 0,
      isLoading: false,
      error: null,
      wsConnections: {},
      typingUsers: {},
      onlineUsers: {},
    }),
}));

export default useMessagingStore;
