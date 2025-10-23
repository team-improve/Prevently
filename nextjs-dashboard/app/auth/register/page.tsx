'use client';

import { lusitana } from '@/app/ui/fonts';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEmailValidation } from '@/app/hooks/useEmailValidation';
import { usePasswordValidation } from '@/app/hooks/usePasswordValidation';
import { useUsernameValidation } from '@/app/hooks/useUsernameValidation';
import { authApi, authStorage } from '@/lib/auth-api';
import { googleAuth } from '@/lib/google-auth';
import AuthGuard from '@/components/AuthGuard';

function RegisterContent() {
  const emailValidation = useEmailValidation();
  const passwordValidation = usePasswordValidation();
  const usernameValidation = useUsernameValidation();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initGoogleAuth = async () => {
      try {
        await googleAuth.initialize(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '');
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
      }
    };

    initGoogleAuth();

    const handleGoogleSuccess = (event: any) => {
      setGoogleLoading(false);
      setSuccess(true);
      setErrors([]);

      if (event.detail.idToken) {
        authStorage.setToken(event.detail.idToken);
      }
      if (event.detail.refreshToken) {
        authStorage.setRefreshToken(event.detail.refreshToken);
      }

      setTimeout(() => {
        router.push('/');
      }, 1000);
    };

    const handleGoogleError = (event: any) => {
      setGoogleLoading(false);
      setErrors([event.detail.error.message || 'Google authentication failed']);
    };

    window.addEventListener('google-auth-success', handleGoogleSuccess);
    window.addEventListener('google-auth-error', handleGoogleError);

    return () => {
      window.removeEventListener('google-auth-success', handleGoogleSuccess);
      window.removeEventListener('google-auth-error', handleGoogleError);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!emailValidation.validateEmail()) {
      newErrors.push('Please enter a valid email address');
    }

    if (!usernameValidation.validateUsername()) {
      newErrors.push('Please enter a valid username');
    }

    if (!passwordValidation.isValid) {
      newErrors.push('Password does not meet all requirements');
    }

    if (passwordValidation.password !== confirmPassword) {
      newErrors.push('Passwords do not match');
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      setIsLoading(true);
      try {
        const response = await authApi.register(emailValidation.email, passwordValidation.password, usernameValidation.username);

        setSuccess(true);
        setErrors([]);

        setTimeout(() => {
          router.push('/auth/login?registered=true');
        }, 3000);
      } catch (error) {
        if (error instanceof Error) {
          setErrors([error.message]);
        } else {
          setErrors(['An unexpected error occurred']);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setErrors([]);
    try {
      await googleAuth.signIn();
    } catch (error) {
      setGoogleLoading(false);
      setErrors(['Failed to initialize Google sign-in']);
    }
  };

  const passwordsMatch = confirmPassword && passwordValidation.password === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`${lusitana.className} text-3xl font-bold text-gray-900 mb-2`}>Prevently</h1>
          <p className="text-gray-600">Create your account</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={emailValidation.email}
                onChange={(e) => emailValidation.setEmail(e.target.value)}
                required
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                  emailValidation.email && emailValidation.isValid === false
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : emailValidation.email && emailValidation.isValid === true
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                }`}
                placeholder="Enter your email"
              />
              {emailValidation.email && emailValidation.isValid === false && (
                <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
              )}
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={usernameValidation.username}
                onChange={(e) => usernameValidation.setUsername(e.target.value)}
                required
                className={usernameValidation.inputClassName}
                placeholder="Choose a username"
              />
              {usernameValidation.username && usernameValidation.isValid === false && (
                <p className="mt-1 text-sm text-red-600">{usernameValidation.errorMessage}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={passwordValidation.password}
                onChange={(e) => passwordValidation.setPassword(e.target.value)}
                required
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                  passwordValidation.password && !passwordValidation.isValid
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : passwordValidation.password && passwordValidation.isValid
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                }`}
                placeholder="Create a password"
              />

              {/* Password Requirements */}
              {passwordValidation.password && (
                <div className="mt-3 space-y-1">
                  <div className={`flex items-center text-sm ${passwordValidation.validation.length ? 'text-green-600' : 'text-red-600'}`}>
                    <span className={`mr-2 ${passwordValidation.validation.length ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordValidation.validation.length ? '✓' : '✗'}
                    </span>
                    6-4096 characters
                  </div>
                  <div className={`flex items-center text-sm ${passwordValidation.validation.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                    <span className={`mr-2 ${passwordValidation.validation.uppercase ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordValidation.validation.uppercase ? '✓' : '✗'}
                    </span>
                    One uppercase letter
                  </div>
                  <div className={`flex items-center text-sm ${passwordValidation.validation.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                    <span className={`mr-2 ${passwordValidation.validation.lowercase ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordValidation.validation.lowercase ? '✓' : '✗'}
                    </span>
                    One lowercase letter
                  </div>
                  <div className={`flex items-center text-sm ${passwordValidation.validation.number ? 'text-green-600' : 'text-red-600'}`}>
                    <span className={`mr-2 ${passwordValidation.validation.number ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordValidation.validation.number ? '✓' : '✗'}
                    </span>
                    One number
                  </div>
                  <div className={`flex items-center text-sm ${passwordValidation.validation.special ? 'text-green-600' : 'text-red-600'}`}>
                    <span className={`mr-2 ${passwordValidation.validation.special ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordValidation.validation.special ? '✓' : '✗'}
                    </span>
                    One special character
                  </div>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                  confirmPassword && !passwordsMatch
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : confirmPassword && passwordsMatch
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                }`}
                placeholder="Confirm your password"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-green-700">Registration successful! Please check your email to verify your account. Redirecting to login...</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid || !passwordsMatch || !emailValidation.email || emailValidation.isValid !== true || !usernameValidation.username || usernameValidation.isValid !== true}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg transform ${
                passwordValidation.isValid && passwordsMatch && emailValidation.email && emailValidation.isValid === true && usernameValidation.username && usernameValidation.isValid === true && !isLoading
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Register */}
          <button
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? 'Creating Account...' : 'Continue with Google'}
          </button>

          <p className="text-sm text-gray-600 text-center mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthGuard>
      <RegisterContent />
    </AuthGuard>
  );
}