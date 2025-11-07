import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useMessagingStore from '../store/messagingStore';
import { useAuthStore } from '../store/authStore';
import { confessionAPI } from '../api/confession';
import messagingAPI from '../api/messaging';
import ConversationList from '../components/messaging/ConversationList';
import ChatView from '../components/messaging/ChatView';
import { FiMessageCircle, FiUsers } from 'react-icons/fi';

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
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showAdminsList, setShowAdminsList] = useState(false);
  const [startingConversation, setStartingConversation] = useState(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchSubscriptions();
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (conversationId) {
      setSelectedConversationId(parseInt(conversationId));
    }
  }, [conversationId]);

  const fetchSubscriptions = async () => {
    setLoadingAdmins(true);
    try {
      const data = await confessionAPI.getSubscriptions();
      const subscriptionsList = data.results || data;
      setSubscriptions(subscriptionsList);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setCurrentConversation(conversation);
    setSelectedConversationId(conversation.id);
    navigate(`/messages/${conversation.id}`);
  };

  const handleStartConversation = async (admin, confessionId) => {
    if (!user) {
      toast.error('Please login to send messages');
      return;
    }

    setStartingConversation(admin.id);
    try {
      // Get or create conversation with this admin for the specific confession
      const conversation = await messagingAPI.getOrCreateConversation(admin.id, confessionId);

      // Refresh conversations list
      await fetchConversations();

      // Navigate to the conversation
      setCurrentConversation(conversation);
      setSelectedConversationId(conversation.id);
      navigate(`/messages/${conversation.id}`);
      setShowAdminsList(false);
      toast.success('Conversation opened!');
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error(error.response?.data?.error || 'Failed to open conversation');
    } finally {
      setStartingConversation(null);
    }
  };

  // Get unique admins from subscriptions
  const getSubscribedAdmins = () => {
    const adminsMap = new Map();

    subscriptions.forEach((sub) => {
      if (sub.confession.admin && sub.confession.admin.id !== user?.id) {
        const adminId = sub.confession.admin.id;
        if (!adminsMap.has(adminId)) {
          adminsMap.set(adminId, {
            ...sub.confession.admin,
            confessions: []
          });
        }
        adminsMap.get(adminId).confessions.push({
          id: sub.confession.id,
          name: sub.confession.name,
          slug: sub.confession.slug
        });
      }
    });

    return Array.from(adminsMap.values());
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

  const subscribedAdmins = getSubscribedAdmins();

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Conversations List */}
      <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>

        {/* Toggle button for admins list */}
        {subscribedAdmins.length > 0 && (
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowAdminsList(!showAdminsList)}
              className="w-full flex items-center justify-between px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <FiMessageCircle size={18} />
                <span className="font-medium">
                  {showAdminsList ? 'Show Conversations' : 'Start New Conversation'}
                </span>
              </span>
              <FiUsers size={18} />
            </button>
          </div>
        )}

        {/* Admins List or Conversations List */}
        {showAdminsList ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FiUsers className="mr-2" />
                Subscribed Confession Admins
              </h2>
              {loadingAdmins ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : subscribedAdmins.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No subscribed confession admins</p>
                  <p className="text-xs mt-1">Subscribe to confessions to message their admins</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subscribedAdmins.map((admin) => (
                    <div
                      key={admin.id}
                      className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {admin.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{admin.username}</p>
                          <p className="text-xs text-gray-500">Admin of {admin.confessions.length} confession(s)</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {admin.confessions.map((confession) => (
                          <button
                            key={confession.id}
                            onClick={() => handleStartConversation(admin, confession.id)}
                            disabled={startingConversation === admin.id}
                            className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="text-sm text-gray-700 truncate">{confession.name}</span>
                            <FiMessageCircle size={14} className="text-blue-600 flex-shrink-0 ml-2" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            isLoading={isLoading}
          />
        )}
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
