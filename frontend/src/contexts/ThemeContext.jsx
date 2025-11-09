import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const { user } = useAuthStore()

  const [darkMode, setDarkMode] = useState(() => {
    // If user is logged in and has a preferred theme, use it
    if (user?.preferred_theme) {
      return user.preferred_theme === 'dark'
    }
    // Otherwise, use saved theme from localStorage
    return localStorage.getItem('darkMode') === 'true'
  })

  // Update theme when user changes (login/logout)
  useEffect(() => {
    if (user?.preferred_theme) {
      const isDark = user.preferred_theme === 'dark'
      if (isDark !== darkMode) {
        setDarkMode(isDark)
      }
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)

    // Apply dark mode class to html element
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)

    // If user is logged in, save preference to backend
    if (user) {
      try {
        const theme = newDarkMode ? 'dark' : 'light'
        await api.patch('/accounts/profile/', { preferred_theme: theme })
        // Update user in auth store
        useAuthStore.getState().updateUser({ preferred_theme: theme })
      } catch (error) {
        console.error('Failed to save theme preference:', error)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
