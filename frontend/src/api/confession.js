import api from './axios'

export const confessionAPI = {
  // Confessions
  getConfessions: async (params) => {
    const response = await api.get('/confessions/', { params })
    return response.data
  },

  getConfession: async (slug) => {
    const response = await api.get(`/confessions/${slug}/`)
    return response.data
  },

  updateConfession: async (slug, confessionData) => {
    const response = await api.patch(`/confessions/${slug}/`, confessionData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  subscribe: async (slug) => {
    const response = await api.post(`/confessions/${slug}/subscribe/`)
    return response.data
  },

  unsubscribe: async (slug) => {
    const response = await api.post(`/confessions/${slug}/unsubscribe/`)
    return response.data
  },

  assignAdmin: async (slug, adminId) => {
    const response = await api.post(`/confessions/${slug}/assign_admin/`, { admin_id: adminId })
    return response.data
  },

  getFollowers: async (slug) => {
    const response = await api.get(`/confessions/${slug}/followers/`)
    return response.data
  },

  // Posts
  getPosts: async (params) => {
    const response = await api.get('/posts/', { params })
    return response.data
  },

  getPost: async (id) => {
    const response = await api.get(`/posts/${id}/`)
    return response.data
  },

  getFeed: async (params) => {
    const response = await api.get('/posts/feed/', { params })
    return response.data
  },

  createPost: async (postData) => {
    const response = await api.post('/posts/', postData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  updatePost: async (id, postData) => {
    const response = await api.patch(`/posts/${id}/`, postData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  deletePost: async (id) => {
    const response = await api.delete(`/posts/${id}/`)
    return response.data
  },

  likePost: async (id) => {
    const response = await api.post(`/posts/${id}/like/`)
    return response.data
  },

  unlikePost: async (id) => {
    const response = await api.post(`/posts/${id}/unlike/`)
    return response.data
  },

  // Comments
  getComments: async (postId) => {
    const response = await api.get('/comments/', { params: { post: postId } })
    return response.data
  },

  createComment: async (commentData) => {
    const response = await api.post('/comments/', commentData)
    return response.data
  },

  deleteComment: async (id) => {
    const response = await api.delete(`/comments/${id}/`)
    return response.data
  },

  // Subscriptions
  getSubscriptions: async () => {
    const response = await api.get('/subscriptions/')
    return response.data
  },
}