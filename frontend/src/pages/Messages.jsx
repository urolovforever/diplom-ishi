import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useMessagingStore from '../store/messagingStore';
import useAuthStore from '../store/authStore';
import ConversationList from '../components/messaging/ConversationList';
import ChatView from '../components/messaging/ChatView';

const Messages = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    fetchConversations,
    isLoading,
  } = useMessagingStore();

  const [selectedConversationId, setSelectedConversationId] = useState(
    conversationId ? parseInt(conversationId) : null
  );

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (conversationId) {
      setSelectedConversationId(parseInt(conversationId));
    }
  }, [conversationId]);

  const handleSelectConversation = (conversation) => {
    setCurrentConversation(conversation);
    setSelectedConversationId(conversation.id);
    navigate(`/messages/${conversation.id}`);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to access messages
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Conversations List */}
      <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>

        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          isLoading={isLoading}
        />
      </div>

      {/* Chat View */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ChatView conversationId={selectedConversationId} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
