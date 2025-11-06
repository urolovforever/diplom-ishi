import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiUsers, FiFileText, FiCheckCircle } from 'react-icons/fi'

const ConfessionCard = ({ confession }) => {
  const navigate = useNavigate()

  const handleAdminClick = (e, username) => {
    e.preventDefault() // Prevent navigation to confession page
    e.stopPropagation()
    navigate(`/user/${username}`)
  }

  return (
    <Link
      to={`/confession/${confession.slug}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden card-hover"
    >
      {/* Header with logo */}
      <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
        {confession.logo ? (
          <img
            src={confession.logo}
            alt={confession.name}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-4xl font-bold opacity-30">
              {confession.name.charAt(0)}
            </span>
          </div>
        )}

        {confession.is_subscribed && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
            <FiCheckCircle size={12} />
            <span>Subscribed</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {confession.name}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {confession.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <FiUsers size={16} />
            <span>{confession.subscribers_count} followers</span>
          </div>

          <div className="flex items-center space-x-1">
            <FiFileText size={16} />
            <span>{confession.posts_count} posts</span>
          </div>
        </div>

        {/* Admin info */}
        {confession.admin && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Admin:{' '}
              <button
                onClick={(e) => handleAdminClick(e, confession.admin.username)}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {confession.admin.username}
              </button>
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}

export default ConfessionCard