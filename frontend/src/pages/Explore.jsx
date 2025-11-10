import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import MainLayout from '../components/layout/MainLayout'
import ConfessionCard from '../components/ConfessionCard'
import Loading from '../components/Loading'
import BackButton from '../components/BackButton'
import { FiSearch } from 'react-icons/fi'
import { useLanguage } from '../contexts/LanguageContext'

const Explore = () => {
  const { t } = useLanguage()
  const [confessions, setConfessions] = useState([])
  const [filteredConfessions, setFilteredConfessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchConfessions()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = confessions.filter(confession =>
        confession.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        confession.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredConfessions(filtered)
    } else {
      setFilteredConfessions(confessions)
    }
  }, [searchTerm, confessions])

  const fetchConfessions = async () => {
    try {
      const data = await confessionAPI.getConfessions({ page_size: 100 })
      const confessionsList = data.results || data

      // Sort by followers count (descending)
      confessionsList.sort((a, b) => (b.subscribers_count || 0) - (a.subscribers_count || 0))

      setConfessions(confessionsList)
      setFilteredConfessions(confessionsList)
    } catch (error) {
      toast.error('Failed to load confessions')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <Loading />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div>
        {/* Back Button */}
        <div className="mb-4 sticky top-0 bg-gray-50 dark:bg-gray-950 pt-2 z-10">
          <BackButton />
        </div>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4">
            {t('explore.exploreConfessions')}
          </h1>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('explore.searchConfessions')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 bg-white dark:bg-gray-800 text-sm sm:text-base dark:text-gray-100 dark:placeholder-gray-400 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
            />
            <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          </div>
        </div>

        {/* Confessions Grid */}
        {filteredConfessions.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-5xl sm:text-6xl mb-4">🔍</div>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-2 px-4">{t('explore.noConfessionsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[500px]:grid-cols-2 gap-4 sm:gap-6">
            {filteredConfessions.map(confession => (
              <ConfessionCard key={confession.id} confession={confession} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default Explore
