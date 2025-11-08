import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { confessionAPI } from '../api/confession'
import { useAuthStore } from '../store/authStore'
import { useLanguage } from '../contexts/LanguageContext'
import MainLayout from '../components/layout/MainLayout'
import Loading from '../components/Loading'
import { FiArrowLeft, FiUser, FiLock } from 'react-icons/fi'

const ConfessionFollowers = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useLanguage()
  const [confession, setConfession] = useState(null)
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)
  const [canViewFollowers, setCanViewFollowers] = useState(false)

  useEffect(() => {
    fetchData()
  }, [slug])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch confession details
      const confessionData = await confessionAPI.getConfession(slug)
      setConfession(confessionData)

      // Check if user can view followers
      const isConfessionAdmin = user && confessionData.admin?.id === user.id
      const isSuperAdmin = user && user.role === 'superadmin'
      const isSubscribed = confessionData.is_subscribed

      if (!user) {
        setCanViewFollowers(false)
        toast.error(t('followers.pleaseLoginToView'))
      } else if (isSubscribed || isConfessionAdmin || isSuperAdmin) {
        setCanViewFollowers(true)
        // Fetch followers
        const followersData = await confessionAPI.getFollowers(slug)
        setFollowers(followersData)
      } else {
        setCanViewFollowers(false)
        toast.error(t('followers.subscribeToView'))
      }
    } catch (error) {
      toast.error(t('followers.failedToLoad'))
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
      <div className="text-center py-12 text-gray-800 dark:text-gray-200">{t('confession.notFound')}</div>
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6">
          {/* Back Button */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <Link
              to={`/confession/${slug}`}
              className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500"
            >
              <FiArrowLeft />
              <span>{t('common.back')} {confession.name}</span>
            </Link>
          </div>

          {/* Confession Info */}
          <div className="p-6 flex items-center space-x-4 border-b border-gray-100 dark:border-gray-700">
            {confession.logo && (
              <img
                src={confession.logo}
                alt={confession.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{confession.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{confession.subscribers_count} {t('common.followers')}</p>
            </div>
          </div>

          {/* Followers List */}
          {!canViewFollowers ? (
            <div className="text-center py-12">
              <FiLock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold mb-2">{t('followers.listPrivate')}</p>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t('followers.subscribeToView')}</p>
              <Link
                to={`/confession/${slug}`}
                className="inline-block px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                {t('followers.goToConfession')}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {followers.length === 0 ? (
                <div className="text-center py-12">
                  <FiUser size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">{t('followers.noFollowersYet')}</p>
                </div>
              ) : (
                followers.map(follower => (
                  <Link
                    key={follower.id}
                    to={`/user/${follower.username}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{follower.username}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('followers.viewProfile')}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default ConfessionFollowers
