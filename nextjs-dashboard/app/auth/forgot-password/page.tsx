'use client';

import { lusitana } from '@/app/ui/fonts';
import { useState } from 'react';
import Link from 'next/link';
import { useEmailValidation } from '@/app/hooks/useEmailValidation';
import { authApi } from '@/lib/auth-api';
import AuthGuard from '@/components/AuthGuard';

function ForgotPasswordContent() {
  const emailValidation = useEmailValidation();
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValidation.validateEmail()) {
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(emailValidation.email);
      setSubmitted(true);
      setErrors([]);
    } catch (error) {
      if (error instanceof Error) {
        setErrors([error.message]);
      } else {
        setErrors(['An unexpected error occurred']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`${lusitana.className} text-3xl font-bold text-gray-900 mb-2`}>Prevently</h1>
          <p className="text-gray-600">Reset your password</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          {!submitted ? (
            <>
              <div className="text-center mb-6">
                <p className="text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
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
                        : 'border-gray-300 focus:ring-green-500 focus:border-transparent'
                    }`}
                    placeholder="Enter your email"
                  />
                  {emailValidation.email && emailValidation.isValid === false && (
                    <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
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

                <button
                  type="submit"
                  disabled={isLoading || !emailValidation.email || emailValidation.isValid !== true}
                  className={`w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                    emailValidation.email && emailValidation.isValid === true && !isLoading
                      ? ''
                      : 'opacity-50 cursor-not-allowed hover:transform-none'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Reset Link...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Check your email!</h3>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <strong>{emailValidation.email}</strong>
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Back to Login
              </Link>
            </div>
          )}

          <p className="text-sm text-gray-600 text-center mt-6">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-green-600 hover:text-green-800 font-medium transition-colors duration-200">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthGuard>
      <ForgotPasswordContent />
    </AuthGuard>
  );
}