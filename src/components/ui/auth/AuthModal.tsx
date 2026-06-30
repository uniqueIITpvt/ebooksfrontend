'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { XMarkIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/primitives/Button';
import { useRouter } from 'next/navigation';

export default function AuthModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login({ email, password });
      if (res.success && res.user) {
        setIsLoginModalOpen(false);
        // Redirect based on role
        const role = res.user.role;
        if (role === 'admin' || role === 'superadmin') {
          router.push('/admin/dashboard');
        } else {
          // Regular user - redirect to subscription or home
          router.push('/subscription');
        }
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6'>
      {/* Backdrop */}
      <div 
        className='absolute inset-0 bg-[#050811]/90 backdrop-blur-md'
        onClick={() => setIsLoginModalOpen(false)}
      />

      {/* Modal */}
      <div className='relative w-full max-w-md bg-[#0B1120] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300'>
        <div className='p-8 sm:p-10'>
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h2 className='text-2xl font-bold text-white font-syne'>Welcome Back</h2>
              <p className='text-white/50 text-sm mt-1'>Sign in to continue your journey</p>
            </div>
            <button 
              onClick={() => setIsLoginModalOpen(false)}
              className='p-2 hover:bg-white/5 rounded-full transition-colors'
            >
              <XMarkIcon className='w-6 h-6 text-white/50' />
            </button>
          </div>

          {error && (
            <div className='mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-white/70 ml-1'>Email Address</label>
              <div className='relative'>
                <EnvelopeIcon className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30' />
                <input 
                  type='email'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='name@example.com'
                  className='w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-white/70 ml-1'>Password</label>
              <div className='relative'>
                <LockClosedIcon className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30' />
                <input 
                  type='password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                  className='w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all'
                />
              </div>
            </div>

            <div className='flex justify-end'>
              <button 
                type='button'
                className='text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors'
              >
                Forgot Password?
              </button>
            </div>

            <Button 
              type='submit'
              loading={isLoading}
              fullWidth
              className='py-4 font-bold rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98]'
            >
              Sign In
            </Button>
          </form>

          <p className='mt-8 text-center text-white/40 text-sm'>
            Don't have an account?{' '}
            <Link 
              href="/user/auth?mode=signup" 
              onClick={() => setIsLoginModalOpen(false)}
              className='text-blue-500 font-bold hover:underline'
            >
              Sign Up Free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
