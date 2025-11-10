import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authAPI } from '../api/auth'
import { FiMail, FiLock, FiKey } from 'react-icons/fi'
import { useLanguage } from '../contexts/LanguageContext'

const PasswordReset = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [step, setStep] = useState(1) // 1: email, 2: code+password
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  })

  const handleRequestCode = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authAPI.passwordResetRequest(email)
      toast.success(t('auth.resetCodeSent'))

      // For development, show the code
      if (response.code) {
        toast.info(`Your reset code is: ${response.code}`, { autoClose: false })
      }

      setStep(2)
    } catch (error) {
      toast.error(t('auth.resetCodeSendFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (formData.new_password !== formData.confirm_password) {
      toast.error(t('auth.passwordsDontMatch'))
      return
    }

    setLoading(true)

    try {
      await authAPI.passwordResetConfirm({
        email,
        code: resetCode,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      })

      toast.success(t('auth.passwordResetSuccess'))
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.error || t('auth.passwordResetFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-800 transition-colors duration-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLock className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('auth.resetPassword')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {step === 1
              ? t('auth.enterEmailForCode')
              : t('auth.enterCodeAndPassword')}
          </p>
        </div>

        {step === 1 ? (
          /* Step 1: Request Reset Code */
          <form onSubmit={handleRequestCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.emailAddress')}
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.sending') : t('auth.sendResetCode')}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                {t('auth.backToLogin')}
              </Link>
            </div>
          </form>
        ) : (
          /* Step 2: Reset Password with Code */
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.resetCode')}
              </label>
              <div className="relative">
                <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent tracking-widest text-center text-lg font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                  placeholder={t('auth.codePlaceholder')}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('auth.checkEmailForCode')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.newPassword')}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                  placeholder={t('auth.enterNewPassword')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.confirmNewPassword')}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    formData.confirm_password === ''
                      ? 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                      : formData.new_password === formData.confirm_password
                        ? 'border-green-500 dark:border-green-600 focus:ring-2 focus:ring-green-500 focus:border-green-500'
                        : 'border-red-500 dark:border-red-600 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  }`}
                  placeholder={t('auth.confirmNewPasswordPlaceholder')}
                />
              </div>
              {formData.confirm_password !== '' && (
                <p className={`text-sm mt-1 font-medium ${
                  formData.new_password === formData.confirm_password
                    ? 'text-green-600 dark:text-green-500'
                    : 'text-red-600 dark:text-red-500'
                }`}>
                  {formData.new_password === formData.confirm_password
                    ? t('auth.passwordsMatch')
                    : t('auth.passwordsDontMatch')}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.resetting') : t('auth.resetPasswordButton')}
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm"
              >
                {t('auth.didntReceiveCode')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PasswordReset
