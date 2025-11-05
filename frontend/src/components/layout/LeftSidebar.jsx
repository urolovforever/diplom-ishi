import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  FiHome,
  FiCompass,
  FiMessageCircle,
  FiBell,
  FiPlusSquare,
  FiUser,
  FiLogOut,
  FiSettings
} from 'react-icons/fi'

const LeftSidebar = () => {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const NavItem = ({ to, icon: Icon, label, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-4 px-5 py-3.5 rounded-xl transition-all duration-200 ${
        isActive(to)
          ? 'bg-blue-50 text-blue-600 font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon size={26} />
      <span className="text-base font-medium">{label}</span>
    </Link>
  )

  return (
    <div className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <Link to="/" className="flex items-center space-x-3 px-6 py-6 border-b border-gray-200">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-2xl">RP</span>
        </div>
        <span className="text-xl font-bold text-gray-800">
          Religion<br />Platform
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <NavItem to="/" icon={FiHome} label="Home" />
        <NavItem to="/explore" icon={FiCompass} label="Explore" />

        {user && (
          <>
            <NavItem to="/messages" icon={FiMessageCircle} label="Messages" />
            <NavItem to="/notifications" icon={FiBell} label="Notifications" />

            {user.role === 'admin' && (
              <NavItem to="/create" icon={FiPlusSquare} label="Create" />
            )}

            <NavItem to="/profile" icon={FiUser} label="Profile" />

            {user.role === 'superadmin' && (
              <NavItem to="/admin" icon={FiSettings} label="Admin Panel" />
            )}
          </>
        )}
      </nav>

      {/* User section */}
      {user ? (
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">{user.username[0].toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{user.username}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-4 px-4 py-3 mt-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <FiLogOut size={26} />
            <span className="text-base font-medium">Logout</span>
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 border-t border-gray-200 space-y-2">
          <Link
            to="/login"
            className="block w-full px-4 py-3 text-center text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="block w-full px-4 py-3 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Register
          </Link>
        </div>
      )}
    </div>
  )
}

export default LeftSidebar
