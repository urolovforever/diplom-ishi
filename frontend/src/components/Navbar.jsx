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
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">RP</span>
            </div>
            <span className="text-xl font-bold text-gray-800 hidden sm:block">
              Religion Platform
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
              <FiHome />
              <span>{t('nav.home')}</span>
            </Link>

            {user ? (
              <>
                <Link to="/profile" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                  <FiUser />
                  <span>{t('nav.profile')}</span>
                </Link>

                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <Link to="/admin" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                    <FiSettings />
                    <span>{t('nav.admin')}</span>
                  </Link>
                )}

                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">{user.username}</p>
                    <p className="text-gray-500 text-xs">{user.role}</p>
                  </div>
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                    />
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 font-medium"
                >
                  <FiLogOut />
                  <span>{t('settings.logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium">
                  {t('auth.login')}
                </Link>
                <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {t('auth.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-blue-600"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <Link
              to="/"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>

            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.profile')}
                </Link>

                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <Link
                    to="/admin"
                    className="block py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.admin')}
                  </Link>
                )}

                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left py-2 text-red-600 hover:text-red-700"
                >
                  {t('settings.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('auth.login')}
                </Link>
                <Link
                  to="/register"
                  className="block py-2 text-gray-700 hover:text-blue-600"
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