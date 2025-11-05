import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import MainLayout from '../components/layout/MainLayout'
import ConfessionCard from '../components/ConfessionCard'
import Loading from '../components/Loading'
import { FiSearch } from 'react-icons/fi'

const Explore = () => {
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Explore Confessions
          </h1>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search confessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>

        {/* Confessions Grid */}
        {filteredConfessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg mb-2">No confessions found</p>
            <p className="text-gray-400 text-sm">
              Try adjusting your search terms
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
