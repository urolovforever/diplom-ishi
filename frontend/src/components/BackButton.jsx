import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { useLanguage } from '../contexts/LanguageContext'

const BackButton = ({ to, label, className = '' }) => {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleClick = () => {
    if (to) {
      navigate(to)
    } else {
      // Go back to previous page, or home if no history
      if (window.history.length > 1) {
        navigate(-1)
      } else {
        navigate('/')
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group ${className}`}
    >
      <div className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
      </div>
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  )
}

export default BackButton
