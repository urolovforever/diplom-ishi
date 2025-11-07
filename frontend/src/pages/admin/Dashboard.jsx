import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminAPI from '../../api/admin';
import { toast } from 'react-toastify';
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
      toast.error('Failed to load dashboard data');
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
      <div className="text-center text-gray-600">
        Failed to load dashboard data
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Users',
      value: dashboard.users.total,
      change: `+${dashboard.users.new_last_30_days} this month`,
      icon: FiUsers,
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      name: 'Confessions',
      value: dashboard.confessions.total,
      change: `${dashboard.confessions.without_admin} without admin`,
      icon: FiMessageSquare,
      color: 'bg-purple-500',
      link: '/admin/confessions',
    },
    {
      name: 'Total Posts',
      value: dashboard.posts.total,
      change: `+${dashboard.posts.new_last_30_days} this month`,
      icon: FiFileText,
      color: 'bg-green-500',
      link: '/admin/analytics',
    },
    {
      name: 'Subscriptions',
      value: dashboard.subscriptions.total,
      change: `+${dashboard.subscriptions.new_last_30_days} this month`,
      icon: FiHeart,
      color: 'bg-red-500',
      link: '/admin/analytics',
    },
    {
      name: 'Total Comments',
      value: dashboard.engagement.total_comments,
      change: `+${dashboard.engagement.comments_last_30_days} this month`,
      icon: FiMessageCircle,
      color: 'bg-yellow-500',
      link: '/admin/analytics',
    },
    {
      name: 'Total Likes',
      value: dashboard.engagement.total_likes,
      change: `+${dashboard.engagement.likes_last_30_days} this month`,
      icon: FiTrendingUp,
      color: 'bg-indigo-500',
      link: '/admin/analytics',
    },
    {
      name: 'Conversations',
      value: dashboard.messaging.total_conversations,
      change: `${dashboard.messaging.total_messages} messages`,
      icon: FiMail,
      color: 'bg-pink-500',
      link: '/admin/analytics',
    },
    {
      name: 'Active Users',
      value: dashboard.users.admins,
      change: 'Admin accounts',
      icon: FiActivity,
      color: 'bg-teal-500',
      link: '/admin/users?role=admin',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Welcome to Admin Dashboard</h1>
        <p className="text-indigo-100">
          Monitor and manage your platform from this central hub
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                30 days
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">
              {stat.name}
            </h3>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <p className="text-xs text-green-600 mt-2 font-medium">
              {stat.change}
            </p>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Confessions */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-indigo-600" />
            Top Confessions by Subscribers
          </h3>
          <div className="space-y-3">
            {dashboard.top_confessions.map((confession, index) => (
              <div
                key={confession.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {confession.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {confession.subscriber_count} subscribers
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Posts */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FiFileText className="mr-2 text-green-600" />
            Top Posts by Views
          </h3>
          <div className="space-y-3">
            {dashboard.top_posts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {post.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {post.confession__name} • {post.views_count} views
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <FiUsers className="mr-2 text-blue-600" />
          Recent Users
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboard.recent_users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">
                        {user.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
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
