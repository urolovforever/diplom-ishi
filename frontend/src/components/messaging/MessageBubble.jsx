import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ message, isOwnMessage, onEdit, onDelete, onPin, onReply }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      onEdit(message.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDelete(message.id);
    }
  };

  const getStatusIcon = () => {
    if (!isOwnMessage) return null;

    switch (message.status) {
      case 'sent':
        return (
          <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
          </svg>
        );
      case 'delivered':
        return (
          <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
          </svg>
        );
      case 'seen':
        return (
          <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Reply Preview */}
        {message.reply_to && (
          <div className="mb-1 px-3 py-1 bg-gray-100 rounded-t-lg text-xs text-gray-600 border-l-2 border-indigo-500">
            <p className="font-medium">{message.reply_to.sender.username}</p>
            <p className="truncate">{message.reply_to.content}</p>
          </div>
        )}

        {/* Message Content */}
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
          } ${message.reply_to ? 'rounded-tl-none' : ''}`}
        >
          {!isOwnMessage && (
            <p className="text-xs font-medium mb-1 text-gray-600">{message.sender.username}</p>
          )}

          {isEditing ? (
            <div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-2 border rounded text-sm text-gray-900"
                rows={3}
              />
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-xs"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(message.content);
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-800 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id}>
                      {attachment.file_type === 'image' ? (
                        <img
                          src={attachment.file}
                          alt={attachment.file_name}
                          className="max-w-full rounded"
                        />
                      ) : (
                        <a
                          href={attachment.file}
                          download
                          className={`flex items-center space-x-2 p-2 rounded ${
                            isOwnMessage ? 'bg-indigo-500' : 'bg-gray-100'
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
          <div className={`flex items-center space-x-1 mt-1 text-xs ${isOwnMessage ? 'text-indigo-200' : 'text-gray-500'}`}>
            <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
            {message.is_edited && <span>• edited</span>}
            {getStatusIcon()}
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && !isEditing && (
          <div className={`flex space-x-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <button
              onClick={() => onReply(message)}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
            >
              Reply
            </button>
            {isOwnMessage && message.can_edit && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                Edit
              </button>
            )}
            {isOwnMessage && (
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-xs bg-red-200 hover:bg-red-300 text-red-800 rounded"
              >
                Delete
              </button>
            )}
            {!isOwnMessage && (
              <button
                onClick={() => onPin(message.id, !message.is_pinned)}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                {message.is_pinned ? 'Unpin' : 'Pin'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
