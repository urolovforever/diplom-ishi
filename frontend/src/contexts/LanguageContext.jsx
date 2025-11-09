import React, { createContext, useContext, useState, useEffect } from 'react'
import en from '../locales/en.json'
import uz from '../locales/uz.json'
import ru from '../locales/ru.json'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'

const translations = { en, uz, ru }

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const { user } = useAuthStore()

  const [language, setLanguage] = useState(() => {
    // If user is logged in and has a preferred language, use it
    if (user?.preferred_language) {
      return user.preferred_language
    }
    // Otherwise, use saved language from localStorage
    const savedLang = localStorage.getItem('language') || 'en'
    return savedLang
  })

  // Update language when user changes (login/logout)
  useEffect(() => {
    if (user?.preferred_language && user.preferred_language !== language) {
      setLanguage(user.preferred_language)
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key, variables = {}) => {
    const keys = key.split('.')
    let value = translations[language]

    for (const k of keys) {
      value = value?.[k]
    }

    // If no translation found, return the key
    if (!value) {
      return key
    }

    // Replace variables in the translation string
    // Support {{variable}} syntax
    let result = value
    Object.keys(variables).forEach((varKey) => {
      // Escape curly braces properly for regex
      const regex = new RegExp(`\\{\\{${varKey}\\}\\}`, 'g')
      result = result.replace(regex, variables[varKey])
    })

    return result
  }

  const changeLanguage = async (lang) => {
    if (translations[lang]) {
      setLanguage(lang)

      // If user is logged in, save preference to backend
      if (user) {
        try {
          await api.patch('/accounts/profile/', { preferred_language: lang })
          // Update user in auth store
          useAuthStore.getState().updateUser({ preferred_language: lang })
        } catch (error) {
          console.error('Failed to save language preference:', error)
        }
      }
    }
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
