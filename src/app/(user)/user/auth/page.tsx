'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api/authApi';
import { API_CONFIG } from '@/config/api';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

// Loading component for Suspense
function AuthLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}

// Main auth component
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoginModalOpen, authModalMode, authModalReturnUrl, setIsLoginModalOpen } = useAuth();
  const isModal = isLoginModalOpen;
  const onClose = () => setIsLoginModalOpen(false);
  const initialMode = isModal ? authModalMode : (searchParams?.get('mode') === 'signup' ? 'signup' : 'signin');
  const returnUrl = isModal ? authModalReturnUrl : searchParams?.get('returnUrl') || '';
  
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
  }, [initialMode]);

  useEffect(() => {
    router.prefetch('/admin/dashboard');
  }, [router]);
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [signupOtp, setSignupOtp] = useState('');
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [signupEmailVerified, setSignupEmailVerified] = useState(false);
  const [signupOtpLoading, setSignupOtpLoading] = useState(false);
  const [signupOtpCooldown, setSignupOtpCooldown] = useState(0);
  const [signupOtpMessage, setSignupOtpMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const toggleMode = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setIsSignUp(!isSignUp);
      setIsAnimating(false);
      setError(null);
      setSignupOtpMessage(null);
      setForgotMessage(null);
      setForgotError(null);
    }, 300);
  };

  useEffect(() => {
    if (signupOtpCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setSignupOtpCooldown((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [signupOtpCooldown]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email.trim() || !loginData.password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await login({ 
        email: loginData.email, 
        password: loginData.password 
      });

      if (result.success && result.user) {
        // Check role and redirect accordingly
        const role = result.user.role;
        onClose?.();
        if (role === 'admin' || role === 'superadmin') {
          router.replace('/admin/dashboard');
        } else {
          // If returnUrl exists, redirect there (for checkout/subscription flow)
          if (returnUrl) {
            router.push(decodeURIComponent(returnUrl));
          } else {
            router.push('/');
          }
        }
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = forgotEmail.trim() || loginData.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setForgotError('Please enter a valid email address');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotMessage(null);

    try {
      const response = await authApi.forgotPassword(email);
      if (response.success) {
        setForgotMessage(response.message || 'Password reset instructions have been sent to your email.');
      } else {
        setForgotError(response.message || 'Unable to process password reset request.');
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotPassword = () => {
    setForgotEmail(loginData.email);
    setForgotMessage(null);
    setForgotError(null);
    setIsForgotOpen(true);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!signupData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!signupEmailVerified) {
      setError('Please verify your email before creating account');
      return;
    }
    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await authApi.register({
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phone,
        password: signupData.password,
        role: 'user',
      });

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          const signInUrl = returnUrl
            ? `/user/auth?mode=signin&returnUrl=${encodeURIComponent(returnUrl)}`
            : 'signin';

          setSuccess(false);
          setIsSignUp(false);
          setLoginData({ email: signupData.email, password: '' });
          setSignupData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
          setSignupOtp('');
          setSignupOtpSent(false);
          setSignupEmailVerified(false);
          setSignupOtpMessage(null);
          if (isModal) {
            return;
          }
          router.replace(signInUrl);
        }, 1600);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSignupOtp = async () => {
    const email = signupData.email.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address before sending OTP');
      return;
    }

    setSignupOtpLoading(true);
    setError(null);
    setSignupOtpMessage(null);

    try {
      const response = await authApi.sendRegistrationEmailOtp(email);

      if (!response.success) {
        throw new Error(response.message || 'Unable to send OTP');
      }

      setSignupOtpSent(true);
      setSignupEmailVerified(false);
      setSignupOtpCooldown(30);
      setSignupOtpMessage('OTP sent to your email address.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send OTP');
    } finally {
      setSignupOtpLoading(false);
    }
  };

  const handleVerifySignupOtp = async () => {
    const email = signupData.email.trim();

    if (!signupOtp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    setSignupOtpLoading(true);
    setError(null);
    setSignupOtpMessage(null);

    try {
      const response = await authApi.verifyRegistrationEmailOtp(email, signupOtp);

      if (!response.success) {
        throw new Error(response.message || 'Unable to verify OTP');
      }

      setSignupEmailVerified(true);
      setSignupOtpSent(false);
      setSignupOtp('');
      setSignupOtpCooldown(0);
      setSignupOtpMessage('Email verified successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify OTP');
    } finally {
      setSignupOtpLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const target = returnUrl || '/';
    window.location.href = `${API_CONFIG.API_BASE_URL}/auth/google?returnUrl=${encodeURIComponent(target)}`;
  };

  if (success && isSignUp) {
    return (
      <div className={`${isModal ? 'h-full bg-transparent' : 'min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 px-4'} flex items-center justify-center`}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isModal ? 'h-full bg-transparent' : 'h-dvh bg-gradient-to-br from-slate-100 to-slate-200 p-2 md:p-4'} overflow-hidden flex items-center justify-center`}>
      <div className="relative w-full max-w-[280px] md:max-w-3xl h-[calc(100dvh-3rem)] md:h-[calc(100vh-5rem)] max-h-[520px] md:max-h-[560px] min-h-0 md:min-h-[480px] bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        
        {/* Forms Container */}
        <div className="relative w-full h-full flex m-0">
          
          {/* Sign In Form */}
          <div className={`absolute inset-0 w-full md:w-1/2 flex items-start md:items-center justify-center pt-16 md:pt-0 transition-all duration-500 ease-in-out ${isSignUp ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
            <div className="w-full max-w-none md:max-w-sm px-7 md:px-10 py-2 md:py-5">
              <h2 className="mb-4 text-center text-2xl md:text-3xl font-bold text-blue-950">Welcome</h2>
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex h-11 w-full items-center justify-start gap-3 rounded-lg border border-gray-200 bg-white px-4 text-base font-medium text-blue-950 shadow-sm transition-all hover:bg-gray-50"
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
                  </svg>
                  Continue with google
                </button>
              </div>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-200" />
                <span className="text-xl md:text-3xl text-gray-900">or</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              
              <form onSubmit={handleLoginSubmit} className="space-y-3 md:space-y-4">
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="Email"
                    className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-xs md:text-base"
                    required
                  />
                </div>

                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Password"
                    className="w-full pl-10 md:pl-12 pr-10 md:pr-12 py-2 md:py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-xs md:text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="block text-xs md:text-sm text-gray-500 hover:text-gray-700 text-left"
                >
                  Forget Your Password?
                </button>

                {error && !isSignUp && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 md:py-3 bg-blue-600 text-white text-xs md:text-base font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing In...' : 'SIGN IN'}
                </button>
              </form>
              <button
                type="button"
                onClick={toggleMode}
                className="mt-2 block w-full text-center text-[11px] font-semibold text-blue-600 hover:text-blue-700 md:hidden"
              >
                Don&apos;t have an account? Sign Up
              </button>
              {isModal ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="block w-full text-center text-xs md:text-sm text-gray-500 mt-3 md:mt-5 hover:text-gray-700"
                >
                  Back to Home
                </button>
              ) : (
                <Link href="/" className="block text-center text-xs md:text-sm text-gray-500 mt-3 md:mt-5 hover:text-gray-700">
                  ← Back to Home
                </Link>
              )}
            </div>
          </div>

          {/* Sign Up Form */}
          <div className={`absolute inset-0 left-auto right-0 w-full md:w-1/2 flex items-center justify-center transition-all duration-500 ease-in-out ${isSignUp ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
            <div className="max-w-[260px] md:max-w-sm w-full px-3 md:px-10 py-2 md:py-4">
              <h2 className="text-lg md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">Create Account</h2>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="mb-3 flex h-10 md:h-11 w-full items-center justify-start gap-3 rounded-lg border border-gray-200 bg-white px-4 text-sm md:text-base font-medium text-blue-950 shadow-sm transition-all hover:bg-gray-50"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
                </svg>
                Continue with google
              </button>
              <div className="mb-2 md:mb-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-200" />
                <span className="text-lg md:text-2xl text-gray-900">or</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              
              <form onSubmit={handleSignupSubmit} className="space-y-2 md:space-y-3">
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    placeholder="Name"
                    className="w-full pl-11 md:pl-12 pr-4 py-2 md:py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    required
                  />
                </div>
                
                <div className="space-y-1.5 md:space-y-2">
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={signupData.email}
                        onChange={(e) => {
                          setSignupData({ ...signupData, email: e.target.value });
                          setSignupOtp('');
                          setSignupOtpSent(false);
                          setSignupEmailVerified(false);
                          setSignupOtpCooldown(0);
                          setSignupOtpMessage(null);
                        }}
                        placeholder="Email"
                        className="w-full pl-11 md:pl-12 pr-4 py-2 md:py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendSignupOtp}
                      disabled={signupOtpLoading || signupEmailVerified || signupOtpCooldown > 0 || !signupData.email.trim()}
                      className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white text-xs md:text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {signupOtpLoading
                        ? 'Wait'
                        : signupEmailVerified
                          ? 'Verified'
                          : signupOtpCooldown > 0
                            ? `${signupOtpCooldown}s`
                            : signupOtpSent
                              ? 'Resend'
                              : 'OTP'}
                    </button>
                  </div>

                  {signupOtpSent && (
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <input
                        type="text"
                        value={signupOtp}
                        onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter OTP"
                        className="w-full px-4 py-2 md:py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleVerifySignupOtp}
                        disabled={signupOtpLoading || signupOtp.length < 6}
                        className="px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 text-white text-xs md:text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Verify
                      </button>
                    </div>
                  )}

                  {signupOtpMessage && (
                    <p className={`text-xs font-semibold ${signupEmailVerified ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {signupOtpMessage}
                      {!signupEmailVerified && signupOtpCooldown > 0
                        ? ` Verify in ${signupOtpCooldown}s.`
                        : ''}
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    placeholder="Password"
                    className="w-full pl-11 md:pl-12 pr-12 py-2 md:py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    placeholder="Confirm Password"
                    className="w-full pl-11 md:pl-12 pr-12 py-2 md:py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>

                {error && isSignUp && (
                  <div className="p-2 md:p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs md:text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !signupEmailVerified}
                  className="w-full py-2 md:py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'SIGN UP'}
                </button>
              </form>
              <button
                type="button"
                onClick={toggleMode}
                className="mt-2 block w-full text-center text-[11px] font-semibold text-blue-600 hover:text-blue-700 md:hidden"
              >
                Already have an account? Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Sliding Overlay Panel */}
        <div className={`hidden md:flex absolute top-0 h-full w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex-col items-center justify-center p-8 md:p-12 transition-all duration-500 ease-in-out ${isSignUp ? 'translate-x-0 rounded-r-[80px] md:rounded-r-[150px]' : 'translate-x-full md:translate-x-full rounded-l-[80px] md:rounded-l-[150px]'}`}>
          <div className="absolute top-8 flex h-24 w-44 items-center justify-center">
            <Image
              src="/TechIITlogo-transparent.png"
              alt="TechUniqueIIT Research Center"
              width={152}
              height={72}
              className="h-full w-full object-contain"
            />
          </div>
          
          {/* Sign In Overlay Content (shown when in sign up mode) */}
          <div className={`text-center transition-all duration-500 ${isSignUp ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20 pointer-events-none absolute'}`}>
            <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
            <p className="text-blue-100 mb-8 max-w-xs">
              Enter your personal details to use all of site features
            </p>
            <button
              onClick={toggleMode}
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              SIGN IN
            </button>
          </div>

          {/* Sign Up Overlay Content (shown when in sign in mode) */}
          <div className={`text-center transition-all duration-500 ${!isSignUp ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20 pointer-events-none absolute'}`}>
            <h2 className="text-3xl font-bold mb-4">Hello, Friend!</h2>
            <p className="text-blue-100 mb-8 max-w-xs">
              Register with your personal details to use all of site features
            </p>
            <button
              onClick={toggleMode}
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              SIGN UP
            </button>
          </div>
        </div>

      </div>

      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900">Forgot Password</h3>
            <p className="mt-2 text-sm text-gray-500">
              Enter your email address and we will send password reset instructions if the account exists.
            </p>

            <form onSubmit={handleForgotPasswordSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>

              {forgotError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {forgotError}
                </div>
              )}

              {forgotMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {forgotMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Export with Suspense wrapper
export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthContent />
    </Suspense>
  );
}
