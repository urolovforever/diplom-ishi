import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useLanguage } from '../contexts/LanguageContext'
import { FiHome, FiUser, FiSettings, FiLogOut, FiMenu, FiX } from 'react-icons/fi'

const Navbar = () => {
  const { t } = useLanguage()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 no-underline">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">RP</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:block">
              Religion Platform
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Link to="/" className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 no-underline transition-colors">
              <FiHome />
              <span>{t('nav.home')}</span>
            </Link>

            {user ? (
              <>
                <Link to="/profile" className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 no-underline transition-colors">
                  <FiUser />
                  <span>{t('nav.profile')}</span>
                </Link>

                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <Link to="/admin" className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 no-underline transition-colors">
                    <FiSettings />
                    <span>{t('nav.admin')}</span>
                  </Link>
                )}

                <div className="flex items-center space-x-3">
                  <div className="text-sm hidden lg:block">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{user.username}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">{user.role}</p>
                  </div>
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-blue-500"
                    />
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                >
                  <FiLogOut />
                  <span className="hidden lg:inline">{t('settings.logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 sm:px-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium no-underline transition-colors">
                  {t('auth.login')}
                </Link>
                <Link to="/register" className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 no-underline transition-colors">
                  {t('auth.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/"
              className="block py-3 px-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg no-underline transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center space-x-2">
                <FiHome />
                <span>{t('nav.home')}</span>
              </div>
            </Link>

            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block py-3 px-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg no-underline transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <FiUser />
                    <span>{t('nav.profile')}</span>
                  </div>
                </Link>

                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <Link
                    to="/admin"
                    className="block py-3 px-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg no-underline transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <FiSettings />
                      <span>{t('nav.admin')}</span>
                    </div>
                  </Link>
                )}

                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left py-3 px-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FiLogOut />
                    <span>{t('settings.logout')}</span>
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-3 px-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg no-underline transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('auth.login')}
                </Link>
                <Link
                  to="/register"
                  className="block py-3 px-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg no-underline transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('auth.register')}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
