'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const { signUp, error, clearError } = useAuth();
  const router = useRouter();

  const validatePassword = (pass: string) => {
    if (pass.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(password)) return;
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await signUp(email, password);
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
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Create Your Account</h1>
          <p className="text-xl text-gray-600">Start organizing your finances today</p>
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                className="input pl-12"
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
              />
            </div>
            {password.length >= 6 && (
              <p className="text-green-500 flex items-center gap-2 mt-2">
                <CheckCircle size={16} />
                Password is strong enough
              </p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-lg font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-12"
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
              />
            </div>
            {passwordError && (
              <p className="text-red-500 mt-2">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mb-4"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/signin"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}