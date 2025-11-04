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

  subscribe: async (slug) => {
    const response = await api.post(`/confessions/${slug}/subscribe/`)
    return response.data
  },

  unsubscribe: async (slug) => {
    const response = await api.post(`/confessions/${slug}/unsubscribe/`)
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