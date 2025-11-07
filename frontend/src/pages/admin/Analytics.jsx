import { useState, useEffect } from 'react';
import adminAPI from '../../api/admin';
import { toast } from 'react-toastify';
import {
  FiTrendingUp,
  FiUsers,
  FiFileText,
  FiActivity,
} from 'react-icons/fi';

const Analytics = () => {
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
      toast.error('Failed to load analytics');
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
    return <div className="text-center text-gray-600">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-600 mt-1">Comprehensive platform statistics and insights</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FiUsers size={32} className="opacity-80" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold">{stats.total_users}</p>
          <p className="text-blue-100 text-sm mt-1">Total Users</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FiActivity size={32} className="opacity-80" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              24h
            </span>
          </div>
          <p className="text-3xl font-bold">{systemStats.active_users_24h}</p>
          <p className="text-green-100 text-sm mt-1">Active Users (24h)</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FiTrendingUp size={32} className="opacity-80" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              7 days
            </span>
          </div>
          <p className="text-3xl font-bold">{systemStats.growth.users_7d}</p>
          <p className="text-purple-100 text-sm mt-1">New Users (7d)</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FiFileText size={32} className="opacity-80" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              7 days
            </span>
          </div>
          <p className="text-3xl font-bold">{systemStats.growth.posts_7d}</p>
          <p className="text-orange-100 text-sm mt-1">New Posts (7d)</p>
        </div>
      </div>

      {/* User Stats by Role */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Users by Role</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {stats.users_by_role.user}
            </div>
            <div className="text-sm text-gray-600">Regular Users</div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-500 rounded-full"
                style={{
                  width: `${(stats.users_by_role.user / stats.total_users) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-4xl font-bold text-blue-900 mb-2">
              {stats.users_by_role.admin}
            </div>
            <div className="text-sm text-blue-600">Admins</div>
            <div className="mt-3 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${(stats.users_by_role.admin / stats.total_users) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="text-4xl font-bold text-red-900 mb-2">
              {stats.users_by_role.superadmin}
            </div>
            <div className="text-sm text-red-600">Super Admins</div>
            <div className="mt-3 h-2 bg-red-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{
                  width: `${(stats.users_by_role.superadmin / stats.total_users) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Registration Trend */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly User Registrations</h3>
        <div className="space-y-4">
          {stats.monthly_registrations.map((month) => (
            <div key={month.month} className="flex items-center">
              <div className="w-24 text-sm text-gray-600">{month.month}</div>
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full flex items-center justify-end pr-3 text-white text-sm font-semibold transition-all"
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
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Top Active Users</h3>
        <div className="space-y-3">
          {systemStats.top_users.map((user, index) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-lg">
                  #{index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.username}</p>
                  <p className="text-sm text-gray-500">
                    {user.total_activity} posts & comments
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'superadmin'
                    ? 'bg-red-100 text-red-800'
                    : user.role === 'admin'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
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
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">User Growth</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last 7 days</span>
              <span className="text-2xl font-bold text-green-600">
                +{systemStats.growth.users_7d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last 30 days</span>
              <span className="text-2xl font-bold text-blue-600">
                +{systemStats.growth.users_30d}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Content Growth</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Posts (7 days)</span>
              <span className="text-2xl font-bold text-green-600">
                +{systemStats.growth.posts_7d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Posts (30 days)</span>
              <span className="text-2xl font-bold text-blue-600">
                +{systemStats.growth.posts_30d}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Status */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">User Status Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-5xl font-bold text-green-900 mb-2">
              {stats.active_users}
            </div>
            <div className="text-sm text-green-600 font-medium">Active Users</div>
            <div className="mt-4 text-xs text-gray-600">
              {((stats.active_users / stats.total_users) * 100).toFixed(1)}% of total
            </div>
          </div>

          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="text-5xl font-bold text-red-900 mb-2">
              {stats.inactive_users}
            </div>
            <div className="text-sm text-red-600 font-medium">Inactive Users</div>
            <div className="mt-4 text-xs text-gray-600">
              {((stats.inactive_users / stats.total_users) * 100).toFixed(1)}% of total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
