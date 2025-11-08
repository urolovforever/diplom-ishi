import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import useMessagingStore from '../../store/messagingStore';
import { useAuthStore } from '../../store/authStore';
import WebSocketManager from '../../utils/websocket';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const ChatView = ({ conversationId }) => {
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageRefs = useRef({});

  const { user, token } = useAuthStore();
  const {
    messages,
    fetchMessages,
    addMessage,
    updateMessage,
    removeMessage,
    setTypingUser,
    setUserOnlineStatus,
    markConversationAsRead,
    currentConversation,
  } = useMessagingStore();

  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const conversationMessages = messages[conversationId] || [];

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      markConversationAsRead(conversationId);
    }
  }, [conversationId, fetchMessages, markConversationAsRead]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!conversationId || !token || !user) return;

    const handleMessage = (data) => {
      switch (data.type) {
        case 'chat_message':
          addMessage(conversationId, data.message);
          scrollToBottom();
          // Auto-mark as read
          if (data.message.sender.id !== user.id && wsRef.current) {
            wsRef.current.sendReadReceipt(data.message.id);
          }
          break;

        case 'message_edited':
          updateMessage(conversationId, data.message.id, data.message);
          break;

        case 'message_deleted':
          removeMessage(conversationId, data.message_id);
          break;

        case 'message_pinned':
          updateMessage(conversationId, data.message.id, data.message);
          break;

        case 'typing':
          setTypingUser(conversationId, data.user_id, data.is_typing);
          // Clear typing indicator after 3 seconds
          if (data.is_typing) {
            setTimeout(() => {
              setTypingUser(conversationId, data.user_id, false);
            }, 3000);
          }
          break;

        case 'read_receipt':
          // Update message read status
          updateMessage(conversationId, data.message_id, {
            status: 'seen',
          });
          break;

        case 'user_status':
          setUserOnlineStatus(data.user_id, data.status);
          break;

        case 'error':
          toast.error(data.message);
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    };

    const handleError = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      // Don't show toast for connection errors during reconnection
    };

    const handleClose = () => {
      setIsConnected(false);
    };

    // Create WebSocket connection
    const ws = new WebSocketManager(
      conversationId,
      token,
      handleMessage,
      handleError,
      handleClose
    );

    ws.connect();
    wsRef.current = ws;
    setIsConnected(true);

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [conversationId, token, user, addMessage, updateMessage, removeMessage, setTypingUser, setUserOnlineStatus]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content, attachmentFiles = []) => {
    if ((!content.trim() && attachmentFiles.length === 0) || isSending) return;

    setIsSending(true);

    try {
      // For text-only messages via WebSocket
      if (attachmentFiles.length === 0 && wsRef.current) {
        wsRef.current.sendMessage(content, replyingTo?.id);
        setReplyingTo(null);
      } else {
        // For messages with attachments, use HTTP API
        // The API will create the message and WebSocket will broadcast it
        const messagingAPI = (await import('../../api/messaging')).default;
        await messagingAPI.sendMessage({
          conversation: conversationId,
          content: content,
          attachment_files: attachmentFiles,
          reply_to: replyingTo?.id,
        });
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (wsRef.current) {
      wsRef.current.sendTypingIndicator(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current) {
          wsRef.current.sendTypingIndicator(false);
        }
      }, 2000);
    }
  };

  const handleEditMessage = async (messageId, content) => {
    if (wsRef.current) {
      wsRef.current.editMessage(messageId, content);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (wsRef.current) {
      wsRef.current.deleteMessage(messageId);
    }
  };

  const handlePinMessage = async (messageId, isPinned) => {
    if (wsRef.current) {
      wsRef.current.pinMessage(messageId, isPinned);
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a highlight effect
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
  };

  // Get the latest pinned message (only one)
  const pinnedMessage = conversationMessages
    .filter((msg) => msg.is_pinned && !msg.is_deleted)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

  // Show all messages including pinned ones in their original positions
  const allMessages = conversationMessages.filter((msg) => !msg.is_deleted);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
            {currentConversation?.participants[0]?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentConversation?.participants
                .map((p) => p.username)
                .join(', ') || 'Conversation'}
            </h2>
            {currentConversation?.confession && (
              <p className="text-sm text-gray-500 dark:text-gray-400">in {currentConversation.confession.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isConnected ? (
            <span className="flex items-center text-sm text-green-600 dark:text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400 mr-2 animate-pulse"></span>
              Connected
            </span>
          ) : (
            <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 mr-2"></span>
              Connecting...
            </span>
          )}
        </div>
      </div>

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div
          onClick={() => scrollToMessage(pinnedMessage.id)}
          className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-b border-yellow-200 dark:border-yellow-800 p-3 cursor-pointer hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/50 dark:hover:to-amber-900/50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78-.03 1.632.548 2.138.578.506 1.39.686 2.154.503l1.196-.28a1 1 0 00.782-.949V10a1 1 0 00-1-1H6a1 1 0 00-1 1v.274z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">Pinned Message</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                <span className="font-medium">{pinnedMessage.sender.username}:</span> {pinnedMessage.content}
              </p>
            </div>
            <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          allMessages.map((message) => (
            <div
              key={message.id}
              ref={(el) => {
                if (el) messageRefs.current[message.id] = el;
              }}
            >
              <MessageBubble
                message={message}
                isOwnMessage={message.sender.id === user?.id}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onPin={handlePinMessage}
                onReply={handleReply}
              />
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        isSending={isSending}
        replyingTo={replyingTo}
        onCancelReply={cancelReply}
      />
    </div>
  );
};

export default ChatView;
