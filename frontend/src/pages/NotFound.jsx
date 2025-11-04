import React from 'react'
import { Link } from 'react-router-dom'
import { FiHome } from 'react-icons/fi'

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <p className="text-2xl font-semibold text-gray-700 mt-4">
            Page Not Found
          </p>
          <p className="text-gray-500 mt-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          <FiHome />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  )
}

export default NotFound