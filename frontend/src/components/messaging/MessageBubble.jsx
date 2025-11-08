import { useState, useRef, useEffect } from 'react';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';
import { formatRelativeTime } from '../../utils/formatters';
import { useLanguage } from '../../contexts/LanguageContext';

const MessageBubble = ({ message, isOwnMessage, onEdit, onDelete, onPin, onReply }) => {
  const { language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      onEdit(message.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowContextMenu(false);
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDelete(message.id);
    }
  };

  const handlePin = () => {
    setShowContextMenu(false);
    onPin(message.id, !message.is_pinned);
  };

  const handleReply = () => {
    setShowContextMenu(false);
    onReply(message);
  };

  const handleEdit = () => {
    setShowContextMenu(false);
    setIsEditing(true);
  };

  const getStatusIcon = () => {
    if (!isOwnMessage) return null;

    if (message.is_read || message.status === 'seen') {
      return (
        <div className="flex items-center ml-1" title="Seen">
          <FiCheckCircle className="h-3.5 w-3.5 text-blue-400" />
          <FiCheckCircle className="h-3.5 w-3.5 -ml-2 text-blue-400" />
        </div>
      );
    } else if (message.status === 'delivered') {
      return (
        <div className="flex items-center ml-1" title="Delivered">
          <FiCheck className="h-3.5 w-3.5" />
          <FiCheck className="h-3.5 w-3.5 -ml-1.5" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center ml-1" title="Sent">
          <FiCheck className="h-3.5 w-3.5" />
        </div>
      );
    }
  };

  return (
    <>
      <div
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
        onContextMenu={handleContextMenu}
      >
        <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          {/* Pinned indicator */}
          {message.is_pinned && (
            <div className="flex items-center space-x-1 mb-1 text-xs text-yellow-600 dark:text-yellow-400">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78-.03 1.632.548 2.138.578.506 1.39.686 2.154.503l1.196-.28a1 1 0 00.782-.949V10a1 1 0 00-1-1H6a1 1 0 00-1 1v.274z" />
              </svg>
              <span>Pinned</span>
            </div>
          )}

          {/* Reply Preview */}
          {message.reply_to && (
            <div className="mb-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-t-lg text-xs border-l-2 border-indigo-500 dark:border-indigo-400">
              <p className="font-medium text-gray-700 dark:text-gray-300">{message.reply_to.sender.username}</p>
              <p className="truncate text-gray-600 dark:text-gray-400">{message.reply_to.content}</p>
            </div>
          )}

          {/* Message Content */}
          <div
            className={`px-4 py-2.5 rounded-lg shadow-sm ${
              isOwnMessage
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-br-sm'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-sm'
            } ${message.reply_to ? 'rounded-tl-none' : ''}`}
          >
            {!isOwnMessage && (
              <p className="text-xs font-semibold mb-1 text-indigo-600 dark:text-indigo-400">{message.sender.username}</p>
            )}

            {isEditing ? (
              <div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  rows={3}
                  autoFocus
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded text-xs font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContent(message.content);
                    }}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment) => (
                      <div key={attachment.id}>
                        {attachment.file_type === 'image' ? (
                          <img
                            src={attachment.file}
                            alt={attachment.file_name}
                            className="max-w-full rounded border border-gray-200 dark:border-gray-600"
                          />
                        ) : (
                          <a
                            href={attachment.file}
                            download
                            className={`flex items-center space-x-2 p-2 rounded ${
                              isOwnMessage ? 'bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700' : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
                            }`}
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                            </svg>
                            <span className="text-xs">{attachment.file_name}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Message metadata */}
            <div className={`flex items-center space-x-1 mt-1.5 text-xs ${isOwnMessage ? 'text-indigo-200 dark:text-indigo-300 justify-end' : 'text-gray-500 dark:text-gray-400'}`}>
              <span>{formatRelativeTime(message.created_at, language)}</span>
              {message.is_edited && <span>• edited</span>}
              {getStatusIcon()}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]"
          style={{
            top: `${contextMenuPosition.y}px`,
            left: `${contextMenuPosition.x}px`,
          }}
        >
          <button
            onClick={handleReply}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>Reply</span>
          </button>

          {isOwnMessage && message.can_edit && (
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          )}

          <button
            onClick={handlePin}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78-.03 1.632.548 2.138.578.506 1.39.686 2.154.503l1.196-.28a1 1 0 00.782-.949V10a1 1 0 00-1-1H6a1 1 0 00-1 1v.274z" />
            </svg>
            <span>{message.is_pinned ? 'Unpin' : 'Pin'}</span>
          </button>

          {isOwnMessage && (
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default MessageBubble;
