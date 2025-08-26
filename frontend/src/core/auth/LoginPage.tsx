import React from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from './AuthProvider'
import { LoginCredentials } from './types'
import { Navigate, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { Logo } from '@/shared/components/ui/Logo'

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>()

  // Redirect if already authenticated  
  if (isAuthenticated && user) {
    if (user.is_superadmin) {
      return <Navigate to="/superadmin" replace />
    }
    return <Navigate to="/apps" replace />
  }

  const onSubmit = async (data: LoginCredentials) => {
    try {
      const user = await login(data)
      console.log('🔍 LOGIN DEBUG - User object:', user)
      console.log('🔍 LOGIN DEBUG - is_superadmin:', user.is_superadmin)
      
      // Handle redirect based on user type
      if (user.is_superadmin) {
        console.log('✅ Redirecting to superadmin dashboard')
        navigate('/superadmin')
      } else {
        console.log('✅ Redirecting to apps launcher')
        navigate('/apps')
      }
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error)
      // Error is already handled by AuthProvider
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex justify-center">
            <Logo size="xl" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to NeuraCRM
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your credentials to access your account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+$/,
                      message: 'Invalid email address',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}