import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import MainLayout from '../components/layout/MainLayout'
import Loading from '../components/Loading'
import { FiArrowLeft, FiUser } from 'react-icons/fi'

const ConfessionFollowers = () => {
  const { slug } = useParams()
  const [confession, setConfession] = useState(null)
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [slug])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch confession details
      const confessionData = await confessionAPI.getConfession(slug)
      setConfession(confessionData)

      // Fetch followers
      const followersData = await confessionAPI.getFollowers(slug)
      setFollowers(followersData)
    } catch (error) {
      toast.error('Failed to load followers')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <MainLayout>
      <Loading />
    </MainLayout>
  )

  if (!confession) return (
    <MainLayout>
      <div className="text-center py-12">Confession not found</div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          {/* Back Button */}
          <div className="p-4 border-b border-gray-100">
            <Link
              to={`/confession/${slug}`}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <FiArrowLeft />
              <span>Back to {confession.name}</span>
            </Link>
          </div>

          {/* Confession Info */}
          <div className="p-6 flex items-center space-x-4 border-b border-gray-100">
            {confession.logo && (
              <img
                src={confession.logo}
                alt={confession.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{confession.name}</h1>
              <p className="text-gray-600">{followers.length} followers</p>
            </div>
          </div>

          {/* Followers List */}
          <div className="divide-y divide-gray-100">
            {followers.length === 0 ? (
              <div className="text-center py-12">
                <FiUser size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No followers yet</p>
              </div>
            ) : (
              followers.map(follower => (
                <Link
                  key={follower.id}
                  to={`/user/${follower.username}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {follower.avatar ? (
                      <img
                        src={follower.avatar}
                        alt={follower.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {follower.username[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">{follower.username}</p>
                      <p className="text-sm text-gray-500">View profile</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default ConfessionFollowers
