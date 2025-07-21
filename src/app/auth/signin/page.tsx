'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, error, clearError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Welcome Back!</h1>
          <p className="text-xl text-gray-600">Sign in to your Finance Buckets</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-0.5" size={20} />
              <div>
                <p className="text-red-800">{error}</p>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-red-600 underline text-sm mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="email" className="block text-lg font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-12"
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-lg font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-12"
                placeholder="Your password"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="mb-6">
            <Link
              href="/auth/reset-password"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mb-4"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}