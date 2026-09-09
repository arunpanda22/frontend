'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { FirebaseError } from 'firebase/app'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oobCode = searchParams.get('oobCode') // Firebase action code from email link
  
  const [email, setEmail] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [validCode, setValidCode] = useState(false)

  // Verify the reset code when component mounts
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode || !auth) {
        setError('Invalid or missing reset link')
        setVerifying(false)
        return
      }

      try {
        // Verify the code and get the user's email
        const userEmail = await verifyPasswordResetCode(auth, oobCode)
        setEmail(userEmail)
        setValidCode(true)
      } catch (error) {
        if (error instanceof FirebaseError) {
          switch (error.code) {
            case 'auth/expired-action-code':
              setError('This reset link has expired. Please request a new one.')
              break
            case 'auth/invalid-action-code':
              setError('This reset link is invalid or has already been used.')
              break
            default:
              setError('Unable to verify reset link. Please try again.')
          }
        } else {
          setError('An unexpected error occurred')
        }
        setValidCode(false)
      } finally {
        setVerifying(false)
      }
    }

    verifyCode()
  }, [oobCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!oobCode || !auth) {
      setError('Invalid reset link')
      return
    }

    // Validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, newPassword)
      
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?reset=success')
      }, 3000)
      
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/expired-action-code':
            setError('This reset link has expired. Please request a new one.')
            break
          case 'auth/invalid-action-code':
            setError('This reset link is invalid or has already been used.')
            break
          case 'auth/weak-password':
            setError('Password is too weak. Please choose a stronger password.')
            break
          default:
            setError('Failed to reset password. Please try again.')
        }
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while verifying code
  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  // Show error if code is invalid
  if (!validCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                href="/forgot-password"
                className="inline-flex justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all duration-200"
              >
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
              <p className="text-gray-600 mb-4">Your password has been changed successfully.</p>
              <p className="text-sm text-gray-500 mb-6">Redirecting to login page...</p>
              <Link
                href="/login"
                className="inline-flex justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all duration-200"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show password reset form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              {error}
            </div>
          )}

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Create New Password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              For account: <span className="font-medium">{email}</span>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                required
                minLength={6}
                className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                minLength={6}
                className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                  Resetting password...
                </div>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}