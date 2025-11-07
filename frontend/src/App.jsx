import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { authAPI } from './api/auth'

// Pages
import Home from './pages/Home'
import Explore from './pages/Explore'
import CreatePost from './pages/CreatePost'
import EditPost from './pages/EditPost'
import Login from './pages/Login'
import Register from './pages/Register'
import PasswordReset from './pages/PasswordReset'
import ConfessionPage from './pages/ConfessionPage'
import ConfessionFollowers from './pages/ConfessionFollowers'
import PostDetails from './pages/PostDetails'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import AdminPanel from './pages/AdminPanel'
import Messages from './pages/Messages'
import NotFound from './pages/NotFound'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" />
}

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user } = useAuthStore()
  return user && (user.role === 'admin' || user.role === 'superadmin')
    ? children
    : <Navigate to="/" />
}

function App() {
  const { user, token, setAuth, logout } = useAuthStore()

  // Load user profile if token exists but user doesn't
  useEffect(() => {
    const loadUserProfile = async () => {
      if (token && !user) {
        try {
          const profileData = await authAPI.getProfile()
          setAuth(profileData, token)
        } catch (error) {
          // If token is invalid, logout
          console.error('Failed to load user profile:', error)
          logout()
        }
      }
    }

    loadUserProfile()
  }, [token, user, setAuth, logout])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/password-reset" element={<PasswordReset />} />
      <Route path="/confession/:slug" element={<ConfessionPage />} />
      <Route path="/confession/:slug/followers" element={<ConfessionFollowers />} />
      <Route path="/post/:id" element={<PostDetails />} />
      <Route path="/user/:username" element={<UserProfile />} />

      {/* Protected Routes */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/messages" element={
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      } />

      <Route path="/messages/:conversationId" element={
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/create" element={
        <AdminRoute>
          <CreatePost />
        </AdminRoute>
      } />

      <Route path="/post/:id/edit" element={
        <AdminRoute>
          <EditPost />
        </AdminRoute>
      } />

      <Route path="/admin" element={
        <AdminRoute>
          <AdminPanel />
        </AdminRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App