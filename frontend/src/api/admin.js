import api from './axios';

const adminAPI = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/accounts/admin/dashboard/');
    return response.data;
  },

  // User Management
  getUsers: async (params = {}) => {
    const response = await api.get('/accounts/admin/users/', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/accounts/admin/users/${id}/`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/accounts/admin/users/', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.patch(`/accounts/admin/users/${id}/`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/accounts/admin/users/${id}/`);
    return response.data;
  },

  changeUserRole: async (id, role) => {
    const response = await api.post(`/accounts/admin/users/${id}/change_role/`, { role });
    return response.data;
  },

  toggleUserActive: async (id) => {
    const response = await api.post(`/accounts/admin/users/${id}/toggle_active/`);
    return response.data;
  },

  getUserActivity: async (id) => {
    const response = await api.get(`/accounts/admin/users/${id}/activity/`);
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/accounts/admin/users/stats/');
    return response.data;
  },

  // Confession Management
  getConfessions: async () => {
    const response = await api.get('/accounts/admin/confessions/');
    return response.data;
  },

  assignConfessionAdmin: async (confessionId, userId) => {
    const response = await api.post('/accounts/admin/confessions/', {
      confession_id: confessionId,
      user_id: userId,
    });
    return response.data;
  },

  // System Stats
  getSystemStats: async () => {
    const response = await api.get('/accounts/admin/system-stats/');
    return response.data;
  },
};

export default adminAPI;
