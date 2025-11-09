import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminAPI from '../../api/admin';
import { toast } from 'react-toastify';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  FiUsers,
  FiMessageSquare,
  FiFileText,
  FiHeart,
  FiMessageCircle,
  FiTrendingUp,
  FiActivity,
  FiMail,
} from 'react-icons/fi';

const Dashboard = () => {
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error(t('admin.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {t('admin.failedToLoadData')}
      </div>
    );
  }

  const stats = [
    {
      name: t('admin.totalUsers'),
      value: dashboard.users.total,
      change: `+${dashboard.users.new_last_30_days} ${t('admin.thisMonth')}`,
      icon: FiUsers,
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      name: t('admin.totalConfessions'),
      value: dashboard.confessions.total,
      change: `${dashboard.confessions.without_admin} ${t('admin.withoutAdmin')}`,
      icon: FiMessageSquare,
      color: 'bg-purple-500',
      link: '/admin/confessions',
    },
    {
      name: t('admin.totalPosts'),
      value: dashboard.posts.total,
      change: `+${dashboard.posts.new_last_30_days} ${t('admin.thisMonth')}`,
      icon: FiFileText,
      color: 'bg-green-500',
      link: '/admin/analytics',
    },
    {
      name: t('admin.totalSubscriptions'),
      value: dashboard.subscriptions.total,
      change: `+${dashboard.subscriptions.new_last_30_days} ${t('admin.thisMonth')}`,
      icon: FiHeart,
      color: 'bg-red-500',
      link: '/admin/analytics',
    },
    {
      name: t('admin.totalComments'),
      value: dashboard.engagement.total_comments,
      change: `+${dashboard.engagement.comments_last_30_days} ${t('admin.thisMonth')}`,
      icon: FiMessageCircle,
      color: 'bg-yellow-500',
      link: '/admin/analytics',
    },
    {
      name: t('admin.totalLikes'),
      value: dashboard.engagement.total_likes,
      change: `+${dashboard.engagement.likes_last_30_days} ${t('admin.thisMonth')}`,
      icon: FiTrendingUp,
      color: 'bg-indigo-500',
      link: '/admin/analytics',
    },
    {
      name: t('admin.conversations'),
      value: dashboard.messaging.total_conversations,
      change: `${dashboard.messaging.total_messages} ${t('admin.messages')}`,
      icon: FiMail,
      color: 'bg-pink-500',
      link: '/admin/analytics',
    },
    {
      name: t('admin.activeUsers'),
      value: dashboard.users.admins,
      change: t('admin.adminAccounts'),
      icon: FiActivity,
      color: 'bg-teal-500',
      link: '/admin/users?role=admin',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className={`${darkMode ? 'bg-gradient-to-r from-blue-800 to-purple-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600'} text-white p-8 rounded-2xl shadow-xl`}>
        <h1 className="text-3xl font-bold mb-2">{t('admin.welcomeToDashboard')}</h1>
        <p className={`${darkMode ? 'text-blue-200' : 'text-indigo-100'}`}>
          {t('admin.monitorPlatform')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-100'} rounded-xl shadow-md hover:shadow-xl transition-all p-6 border no-underline`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
              <span className={`text-xs ${darkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-100'} px-2 py-1 rounded-full`}>
                {t('admin.days30')}
              </span>
            </div>
            <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>
              {stat.name}
            </h3>
            <div className="flex items-end justify-between">
              <p className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{stat.value}</p>
            </div>
            <p className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-600'} mt-2 font-medium`}>
              {stat.change}
            </p>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Confessions */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md p-6 border`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4 flex items-center`}>
            <FiTrendingUp className={`mr-2 ${darkMode ? 'text-blue-400' : 'text-indigo-600'}`} />
            {t('admin.topConfessionsBySubscribers')}
          </h3>
          <div className="space-y-3">
            {dashboard.top_confessions.map((confession, index) => (
              <div
                key={confession.id}
                className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition-colors`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} text-white rounded-full h-10 w-10 flex items-center justify-center font-bold`}>
                    #{index + 1}
                  </div>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {confession.name}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {confession.subscriber_count} {t('admin.subscribers')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Posts */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md p-6 border`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4 flex items-center`}>
            <FiFileText className={`mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            {t('admin.topPostsByViews')}
          </h3>
          <div className="space-y-3">
            {dashboard.top_posts.map((post, index) => (
              <div
                key={post.id}
                className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition-colors`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-teal-700' : 'bg-gradient-to-br from-green-500 to-teal-600'} text-white rounded-full h-10 w-10 flex items-center justify-center font-bold`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} truncate`}>
                      {post.title}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {post.confession__name} • {post.views_count} {t('admin.views')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md p-6 border`}>
        <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4 flex items-center`}>
          <FiUsers className={`mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          {t('admin.recentUsers')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase`}>
                  {t('admin.user')}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase`}>
                  {t('userProfile.email')}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase`}>
                  {t('admin.role')}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase`}>
                  {t('admin.joined')}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {dashboard.recent_users.map((user) => (
                <tr key={user.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className={`h-8 w-8 rounded-full ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-bold text-sm`}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {user.username}
                      </span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'superadmin'
                          ? darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                          : user.role === 'admin'
                          ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                          : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {new Date(user.date_joined).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
