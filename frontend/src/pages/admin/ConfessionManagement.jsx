import { useState, useEffect } from 'react';
import adminAPI from '../../api/admin';
import { toast } from 'react-toastify';
import {
  FiMessageSquare,
  FiUsers,
  FiFileText,
  FiUserPlus,
  FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';

const ConfessionManagement = () => {
  const [confessions, setConfessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedConfession, setSelectedConfession] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [confessionsData, usersData] = await Promise.all([
        adminAPI.getConfessions(),
        adminAPI.getUsers({ role: 'admin' }),
      ]);
      setConfessions(confessionsData);
      setUsers(usersData.results || usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAdmin = async () => {
    if (!selectedConfession || !selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      await adminAPI.assignConfessionAdmin(selectedConfession.id, selectedUserId);
      toast.success('Admin assigned successfully');
      setShowAssignModal(false);
      fetchData();
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast.error(error.response?.data?.error || 'Failed to assign admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confession Management</h1>
          <p className="text-gray-600 mt-1">Manage confessions and assign admins</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FiRefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Confessions</p>
              <p className="text-3xl font-bold mt-2">{confessions.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiMessageSquare size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Subscribers</p>
              <p className="text-3xl font-bold mt-2">
                {confessions.reduce((sum, c) => sum + c.subscriber_count, 0)}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiUsers size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Posts</p>
              <p className="text-3xl font-bold mt-2">
                {confessions.reduce((sum, c) => sum + c.post_count, 0)}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiFileText size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Confessions without Admin Warning */}
      {confessions.some((c) => !c.admin) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <FiAlertCircle className="text-yellow-600 mr-3" size={24} />
            <div>
              <p className="text-yellow-800 font-semibold">Action Required</p>
              <p className="text-yellow-700 text-sm">
                {confessions.filter((c) => !c.admin).length} confession(s) don't have an assigned
                admin
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {confessions.map((confession) => (
          <div
            key={confession.id}
            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Header with Logo */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {confession.logo ? (
                    <img
                      src={confession.logo}
                      alt={confession.name}
                      className="h-16 w-16 rounded-full object-cover border-4 border-white"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold">
                      {confession.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{confession.name}</h3>
                    <p className="text-indigo-100 text-sm">@{confession.slug}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-4 line-clamp-2">{confession.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FiUsers className="text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Subscribers</p>
                      <p className="text-lg font-bold text-gray-900">
                        {confession.subscriber_count}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FiFileText className="text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Posts</p>
                      <p className="text-lg font-bold text-gray-900">{confession.post_count}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Info */}
              <div className="border-t border-gray-200 pt-4">
                {confession.admin ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold">
                        {confession.admin.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Admin</p>
                        <p className="font-semibold text-gray-900">{confession.admin.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedConfession(confession);
                        setSelectedUserId(confession.admin.id);
                        setShowAssignModal(true);
                      }}
                      className="px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Change Admin
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-orange-600">
                      <FiAlertCircle />
                      <span className="text-sm font-medium">No admin assigned</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedConfession(confession);
                        setSelectedUserId('');
                        setShowAssignModal(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <FiUserPlus size={16} />
                      <span>Assign Admin</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Admin Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Admin</h3>
            <p className="text-gray-600 mb-6">
              Select an admin for <span className="font-semibold">{selectedConfession?.name}</span>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Admin User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select Admin --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Only users with 'admin' or 'superadmin' role are shown
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignAdmin}
                disabled={!selectedUserId}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfessionManagement;
