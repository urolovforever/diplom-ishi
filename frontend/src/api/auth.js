import api from './axios'

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/accounts/register/', userData)
    return response.data
  },

  login: async (credentials) => {
    const response = await api.post('/accounts/login/', credentials)
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/accounts/profile/')
    return response.data
  },

  updateProfile: async (userData) => {
    const response = await api.put('/accounts/profile/', userData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/accounts/change-password/', passwordData)
    return response.data
  },

  passwordResetRequest: async (email) => {
    const response = await api.post('/accounts/password-reset/', { email })
    return response.data
  },

  passwordResetConfirm: async (resetData) => {
    const response = await api.post('/accounts/password-reset-confirm/', resetData)
    return response.data
  },

  getAdminUsers: async () => {
    const response = await api.get('/accounts/admin-users/')
    return response.data
  },

  getUserProfile: async (username) => {
    const response = await api.get(`/accounts/users/${username}/`)
    return response.data
  },
}