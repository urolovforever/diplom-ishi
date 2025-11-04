import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authAPI } from '../api/auth'
import { FiMail, FiLock, FiKey } from 'react-icons/fi'

const PasswordReset = () => {
  const navigate = useNavigate()
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
      toast.success('Reset code sent to your email!')

      // For development, show the code
      if (response.code) {
        toast.info(`Your reset code is: ${response.code}`, { autoClose: false })
      }

      setStep(2)
    } catch (error) {
      toast.error('Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (formData.new_password !== formData.confirm_password) {
      toast.error('Passwords do not match!')
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

      toast.success('Password reset successfully! Please login.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLock className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-600 mt-2">
            {step === 1
              ? 'Enter your email to receive a reset code'
              : 'Enter the code and your new password'}
          </p>
        </div>

        {step === 1 ? (
          /* Step 1: Request Reset Code */
          <form onSubmit={handleRequestCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                Back to Login
              </Link>
            </div>
          </form>
        ) : (
          /* Step 2: Reset Password with Code */
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reset Code
              </label>
              <div className="relative">
                <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent tracking-widest text-center text-lg font-mono"
                  placeholder="000000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Check your email for the 6-digit code
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Didn't receive the code? Try again
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PasswordReset
