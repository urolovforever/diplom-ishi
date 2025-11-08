import { useState, useEffect } from 'react';
import adminAPI from '../../api/admin';
import { toast } from 'react-toastify';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  FiTrendingUp,
  FiUsers,
  FiFileText,
  FiActivity,
} from 'react-icons/fi';

const Analytics = () => {
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [userStats, sysStats] = await Promise.all([
        adminAPI.getUserStats(),
        adminAPI.getSystemStats(),
      ]);
      setStats(userStats);
      setSystemStats(sysStats);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(t('admin.failedToLoadAnalytics'));
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

  if (!stats || !systemStats) {
    return <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('admin.noAnalyticsData')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{t('admin.platformAnalytics')}</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{t('admin.comprehensiveStats')}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${darkMode ? 'bg-gradient-to-br from-blue-700 to-blue-800' : 'bg-gradient-to-br from-blue-500 to-blue-600'} text-white p-6 rounded-xl shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <FiUsers size={32} className="opacity-80" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              {t('admin.total')}
            </span>
          </div>
          <p className="text-3xl font-bold">{stats.total_users}</p>
          <p className={`${darkMode ? 'text-blue-200' : 'text-blue-100'} text-sm mt-1`}>{t('admin.totalUsers')}</p>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-green-700 to-green-800' : 'bg-gradient-to-br from-green-500 to-green-600'} text-white p-6 rounded-xl shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <FiActivity size={32} className="opacity-80" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              {t('admin.24h')}
            </span>
          </div>
          <p className="text-3xl font-bold">{systemStats.active_users_24h}</p>
          <p className={`${darkMode ? 'text-green-200' : 'text-green-100'} text-sm mt-1`}>{t('admin.activeUsers24h')}</p>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-purple-700 to-purple-800' : 'bg-gradient-to-br from-purple-500 to-purple-600'} text-white p-6 rounded-xl shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <FiTrendingUp size={32} className="opacity-80" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              {t('admin.7days')}
            </span>
          </div>
          <p className="text-3xl font-bold">{systemStats.growth.users_7d}</p>
          <p className={`${darkMode ? 'text-purple-200' : 'text-purple-100'} text-sm mt-1`}>{t('admin.newUsers7d')}</p>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-orange-700 to-orange-800' : 'bg-gradient-to-br from-orange-500 to-orange-600'} text-white p-6 rounded-xl shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <FiFileText size={32} className="opacity-80" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              {t('admin.7days')}
            </span>
          </div>
          <p className="text-3xl font-bold">{systemStats.growth.posts_7d}</p>
          <p className={`${darkMode ? 'text-orange-200' : 'text-orange-100'} text-sm mt-1`}>{t('admin.newPosts7d')}</p>
        </div>
      </div>

      {/* User Stats by Role */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md p-6 border`}>
        <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-6`}>{t('admin.usersByRole')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`text-center p-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <div className={`text-4xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
              {stats.users_by_role.user}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('admin.regularUsers')}</div>
            <div className={`mt-3 h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full overflow-hidden`}>
              <div
                className={`h-full ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} rounded-full`}
                style={{
                  width: `${(stats.users_by_role.user / stats.total_users) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className={`text-center p-6 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg`}>
            <div className={`text-4xl font-bold ${darkMode ? 'text-blue-200' : 'text-blue-900'} mb-2`}>
              {stats.users_by_role.admin}
            </div>
            <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>{t('admin.admins')}</div>
            <div className={`mt-3 h-2 ${darkMode ? 'bg-blue-700' : 'bg-blue-200'} rounded-full overflow-hidden`}>
              <div
                className={`h-full ${darkMode ? 'bg-blue-400' : 'bg-blue-500'} rounded-full`}
                style={{
                  width: `${(stats.users_by_role.admin / stats.total_users) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className={`text-center p-6 ${darkMode ? 'bg-red-900' : 'bg-red-50'} rounded-lg`}>
            <div className={`text-4xl font-bold ${darkMode ? 'text-red-200' : 'text-red-900'} mb-2`}>
              {stats.users_by_role.superadmin}
            </div>
            <div className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}>{t('admin.superAdmins')}</div>
            <div className={`mt-3 h-2 ${darkMode ? 'bg-red-700' : 'bg-red-200'} rounded-full overflow-hidden`}>
              <div
                className={`h-full ${darkMode ? 'bg-red-400' : 'bg-red-500'} rounded-full`}
                style={{
                  width: `${(stats.users_by_role.superadmin / stats.total_users) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Registration Trend */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md p-6 border`}>
        <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-6`}>{t('admin.monthlyUserRegistrations')}</h3>
        <div className="space-y-4">
          {stats.monthly_registrations.map((month) => (
            <div key={month.month} className="flex items-center">
              <div className={`w-24 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{month.month}</div>
              <div className="flex-1">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-8 overflow-hidden`}>
                  <div
                    className={`${darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-700' : 'bg-gradient-to-r from-indigo-500 to-purple-600'} h-full rounded-full flex items-center justify-end pr-3 text-white text-sm font-semibold transition-all`}
                    style={{
                      width: `${
                        (month.count / Math.max(...stats.monthly_registrations.map((m) => m.count))) *
                        100
                      }%`,
                      minWidth: month.count > 0 ? '60px' : '0',
                    }}
                  >
                    {month.count > 0 && month.count}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Active Users */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md p-6 border`}>
        <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-6`}>{t('admin.topActiveUsers')}</h3>
        <div className="space-y-3">
          {systemStats.top_users.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition-colors`}
            >
              <div className="flex items-center space-x-4">
                <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-lg`}>
                  #{index + 1}
                </div>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{user.username}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.total_activity} {t('admin.postsAndComments')}
                  </p>
                </div>
              </div>
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
            </div>
          ))}
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md p-6 border`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4`}>{t('admin.userGrowth')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('admin.last7days')}</span>
              <span className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                +{systemStats.growth.users_7d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('admin.last30days')}</span>
              <span className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                +{systemStats.growth.users_30d}
              </span>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md p-6 border`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4`}>{t('admin.contentGrowth')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('admin.posts7days')}</span>
              <span className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                +{systemStats.growth.posts_7d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('admin.posts30days')}</span>
              <span className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                +{systemStats.growth.posts_30d}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Status */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md p-6 border`}>
        <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-6`}>{t('admin.userStatusDistribution')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`text-center p-6 ${darkMode ? 'bg-green-900' : 'bg-green-50'} rounded-lg`}>
            <div className={`text-5xl font-bold ${darkMode ? 'text-green-200' : 'text-green-900'} mb-2`}>
              {stats.active_users}
            </div>
            <div className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-600'} font-medium`}>{t('admin.activeUsers')}</div>
            <div className={`mt-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {((stats.active_users / stats.total_users) * 100).toFixed(1)}% {t('admin.ofTotal')}
            </div>
          </div>

          <div className={`text-center p-6 ${darkMode ? 'bg-red-900' : 'bg-red-50'} rounded-lg`}>
            <div className={`text-5xl font-bold ${darkMode ? 'text-red-200' : 'text-red-900'} mb-2`}>
              {stats.inactive_users}
            </div>
            <div className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'} font-medium`}>{t('admin.inactiveUsers')}</div>
            <div className={`mt-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {((stats.inactive_users / stats.total_users) * 100).toFixed(1)}% {t('admin.ofTotal')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
