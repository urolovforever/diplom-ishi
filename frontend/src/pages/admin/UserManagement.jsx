import { useState, useEffect } from 'react';
import adminAPI from '../../api/admin';
import { toast } from 'react-toastify';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiRefreshCw,
  FiChevronDown,
} from 'react-icons/fi';

const UserManagement = () => {
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (searchTerm) params.search = searchTerm;

      const data = await adminAPI.getUsers(params);
      setUsers(data.results || data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(t('admin.failedToLoadUsers'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await adminAPI.changeUserRole(selectedUser.id, newRole);
      toast.success(t('admin.roleUpdated'));
      setShowRoleModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error(error.response?.data?.error || t('admin.failedToUpdateRole'));
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const response = await adminAPI.toggleUserActive(user.id);
      toast.success(user.is_active ? t('admin.userDeactivated') : t('admin.userActivated'));

      // Update the user in the local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id ? { ...u, is_active: !u.is_active } : u
        )
      );
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error.response?.data?.error || t('admin.failedToUpdateRole'));
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(t('admin.confirmDeleteUser'))) {
      return;
    }

    try {
      await adminAPI.deleteUser(user.id);
      toast.success(t('admin.userDeleted'));
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(t('admin.failedToDeleteUser'));
    }
  };

  const getRoleBadgeColor = (role) => {
    if (darkMode) {
      switch (role) {
        case 'superadmin':
          return 'bg-red-900 text-red-200';
        case 'admin':
          return 'bg-blue-900 text-blue-200';
        default:
          return 'bg-gray-700 text-gray-300';
      }
    } else {
      switch (role) {
        case 'superadmin':
          return 'bg-red-100 text-red-800';
        case 'admin':
          return 'bg-blue-100 text-blue-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
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
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{t('admin.userManagement')}</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage users, roles, and permissions</p>
        </div>
        <button
          onClick={fetchUsers}
          className={`flex items-center space-x-2 px-4 py-2 ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg transition-colors`}
        >
          <FiRefreshCw size={18} />
          <span>{t('admin.refresh')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md p-6 border`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              {t('admin.searchUsers')}
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder={t('admin.searchUsers')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-500' : 'border-gray-300 bg-white'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
              </div>
              <button
                onClick={handleSearch}
                className={`px-6 py-2 ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg transition-colors`}
              >
                {t('admin.search')}
              </button>
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              {t('admin.filterByRole')}
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`w-full px-4 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="">{t('admin.allRoles')}</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b`}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase`}>
                  {t('admin.user')}
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase`}>
                  {t('userProfile.email')}
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase`}>
                  {t('admin.role')}
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase`}>
                  {t('admin.status')}
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase`}>
                  {t('admin.joined')}
                </th>
                <th className={`px-6 py-4 text-right text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase`}>
                  {t('admin.actions')}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`px-6 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('admin.failedToLoadUsers')}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-full ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-bold`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{user.username}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.first_name} {user.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className={`flex items-center ${darkMode ? 'text-green-400' : 'text-green-600'} text-sm`}>
                          <FiUserCheck className="mr-1" />
                          {t('admin.active')}
                        </span>
                      ) : (
                        <span className={`flex items-center ${darkMode ? 'text-red-400' : 'text-red-600'} text-sm`}>
                          <FiUserX className="mr-1" />
                          {t('admin.inactive')}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(user.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Change Role */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setShowRoleModal(true);
                          }}
                          className={`p-2 ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'} rounded-lg transition-colors`}
                          title={t('admin.changeRole')}
                        >
                          <FiShield size={18} />
                        </button>

                        {/* Toggle Active */}
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-2 ${
                            user.is_active
                              ? darkMode ? 'text-orange-400 hover:bg-gray-700' : 'text-orange-600 hover:bg-orange-50'
                              : darkMode ? 'text-green-400 hover:bg-gray-700' : 'text-green-600 hover:bg-green-50'
                          } rounded-lg transition-colors`}
                          title={user.is_active ? t('admin.deactivateUser') : t('admin.activateUser')}
                        >
                          {user.is_active ? <FiUserX size={18} /> : <FiUserCheck size={18} />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className={`p-2 ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
                          title={t('admin.deleteUser')}
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-8 max-w-md w-full mx-4`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4`}>{t('admin.changeRole')}</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              Change role for <span className="font-semibold">{selectedUser?.username}</span>
            </p>

            <div className="space-y-4 mb-6">
              <label className="block">
                <input
                  type="radio"
                  value="user"
                  checked={newRole === 'user'}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mr-2"
                />
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>User - Regular user with basic permissions</span>
              </label>
              <label className="block">
                <input
                  type="radio"
                  value="admin"
                  checked={newRole === 'admin'}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mr-2"
                />
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Admin - Can manage confessions</span>
              </label>
              <label className="block">
                <input
                  type="radio"
                  value="superadmin"
                  checked={newRole === 'superadmin'}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mr-2"
                />
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Super Admin - Full system access</span>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className={`flex-1 px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
              >
                {t('post.cancel')}
              </button>
              <button
                onClick={handleChangeRole}
                className={`flex-1 px-4 py-2 ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg transition-colors`}
              >
                {t('admin.updateRole')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
