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
      toast.error('Connection error. Attempting to reconnect...');
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

  // Group messages by pinned status
  const pinnedMessages = conversationMessages.filter((msg) => msg.is_pinned && !msg.is_deleted);
  const regularMessages = conversationMessages.filter((msg) => !msg.is_pinned && !msg.is_deleted);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
            {currentConversation?.participants[0]?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentConversation?.participants
                .map((p) => p.username)
                .join(', ') || 'Conversation'}
            </h2>
            {currentConversation?.confession && (
              <p className="text-sm text-gray-500">in {currentConversation.confession.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isConnected ? (
            <span className="flex items-center text-sm text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-600 mr-2 animate-pulse"></span>
              Connected
            </span>
          ) : (
            <span className="flex items-center text-sm text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
              Connecting...
            </span>
          )}
        </div>
      </div>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <p className="text-sm font-medium text-yellow-800 mb-2">Pinned Messages</p>
          <div className="space-y-1">
            {pinnedMessages.map((msg) => (
              <div key={msg.id} className="text-sm text-yellow-900 bg-yellow-100 rounded px-2 py-1">
                <span className="font-medium">{msg.sender.username}:</span> {msg.content}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {regularMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          regularMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.sender.id === user?.id}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onPin={handlePinMessage}
              onReply={handleReply}
            />
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
