import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  FiHome,
  FiUsers,
  FiMessageSquare,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiArrowLeft,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if user is super admin
  if (!user || user.role !== 'superadmin') {
    navigate('/');
    toast.error('Access denied: Super admin only');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const navigation = [
    { name: t('admin.dashboard'), href: '/admin', icon: FiHome },
    { name: t('admin.users'), href: '/admin/users', icon: FiUsers },
    { name: t('admin.confessions'), href: '/admin/confessions', icon: FiMessageSquare },
    { name: t('admin.analytics'), href: '/admin/analytics', icon: FiBarChart2 },
    { name: t('admin.settings'), href: '/admin/settings', icon: FiSettings },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} flex`}>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${darkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900' : 'bg-gradient-to-b from-indigo-900 to-indigo-800'} text-white transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-indigo-700'}`}>
          {sidebarOpen && (
            <h1 className={`text-xl font-bold bg-gradient-to-r ${darkMode ? 'from-blue-400 to-purple-400' : 'from-white to-indigo-200'} bg-clip-text text-transparent`}>
              {t('admin.panel')}
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-700'} transition-colors`}
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-indigo-700'}`}>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.username}</p>
                <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-indigo-300'}`}>{t('admin.superAdmin')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Return to Site Button */}
        <div className="p-4">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full ${darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} transition-all shadow-md`}
          >
            <FiArrowLeft size={20} />
            {sidebarOpen && <span className="font-medium">{t('admin.returnToSite')}</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 pt-0 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/admin'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-indigo-700 text-white'} shadow-lg`
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-700/70' : 'text-indigo-200 hover:bg-indigo-700/50'} hover:text-white`
                }`
              }
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-indigo-700'}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full ${darkMode ? 'text-gray-300 hover:bg-red-700' : 'text-indigo-200 hover:bg-red-600'} hover:text-white transition-all`}
          >
            <FiLogOut size={20} />
            {sidebarOpen && <span className="font-medium">{t('settings.logout')}</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b p-4`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {t('admin.adminDashboard')}
            </h2>
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
