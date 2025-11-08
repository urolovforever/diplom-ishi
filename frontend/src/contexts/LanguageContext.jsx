import React, { createContext, useContext, useState, useEffect } from 'react'
import en from '../locales/en.json'
import uz from '../locales/uz.json'
import ru from '../locales/ru.json'

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
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en'
  })

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
    if (!value) return key

    // Replace variables in the translation string
    // Support {{variable}} syntax
    let result = value
    Object.keys(variables).forEach((varKey) => {
      const regex = new RegExp(`{{${varKey}}}`, 'g')
      result = result.replace(regex, variables[varKey])
    })

    return result
  }

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
