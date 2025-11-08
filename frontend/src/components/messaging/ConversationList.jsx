import { formatDistanceToNow } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import { useLanguage } from '../../contexts/LanguageContext';

const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading,
  currentUser,
}) => {
  const { t, language } = useLanguage();

  // Map language codes to date-fns locales
  // Uzbek uses English format as date-fns doesn't have uz locale
  const localeMap = {
    en: enUS,
    ru: ru,
    uz: enUS, // Fallback to English for Uzbek
  };

  const currentLocale = localeMap[language] || enUS;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        <svg
          className="h-12 w-12 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="font-medium">{t('messages.noConversationsYet')}</p>
        <p className="text-sm">{t('messages.startConversationWithAdmin')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const otherParticipants = conversation.participants.filter(
          (p) => currentUser && p.id !== currentUser.id
        );
        const displayName =
          otherParticipants.length > 0
            ? otherParticipants.map((p) => p.username).join(', ')
            : 'Unknown';

        const isSelected = conversation.id === selectedConversationId;

        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`
              flex items-center p-4 cursor-pointer border-b border-gray-200 dark:border-gray-700
              hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
              ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-l-indigo-600 dark:border-l-indigo-400' : ''}
            `}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Conversation Info */}
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {displayName}
                </p>
                {conversation.last_message_preview && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(conversation.last_message_preview.created_at), {
                      addSuffix: true,
                      locale: currentLocale,
                    })}
                  </p>
                )}
              </div>

              {conversation.confession && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('messages.in')} {conversation.confession.name}
                </p>
              )}

              {conversation.last_message_preview && (
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {currentUser && conversation.last_message_preview.sender === currentUser.username
                    ? `${t('messages.you')}: ${conversation.last_message_preview.content}`
                    : conversation.last_message_preview.content}
                </p>
              )}

              {conversation.unread_count > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600 dark:bg-indigo-500 text-white">
                    {conversation.unread_count}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
