'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CalendarIcon,
  StarIcon,
  BookOpenIcon,
  ArrowLeftIcon,
  CameraIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';
import { libraryApi, type LibraryItem } from '@/services/api/libraryApi';
import { authApi, type SavedBook } from '@/services/api/authApi';
import { generateBookSlug } from '@/utils/slugify';

export default function UserProfilePage() {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'saved' | 'library' | 'orders'>('overview');
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [savedBooksLoading, setSavedBooksLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Unable to read image'));
      reader.readAsDataURL(file);
    });

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be 2MB or smaller');
      return;
    }

    setAvatarUploading(true);
    setAvatarError('');

    try {
      const avatar = await fileToDataUrl(file);
      const response = await authApi.updateProfile({ avatar });

      if (!response.success) {
        throw new Error(response.message || 'Unable to update profile image');
      }

      await refreshUser();
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Unable to update profile image');
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'library') {
      setActiveTab('library');
    } else if (params.get('tab') === 'saved') {
      setActiveTab('saved');
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void refreshUser();
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user?.phone]);

  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpMessage(null);

    try {
      const response = await authApi.sendPhoneOtp(phone);

      if (!response.success) {
        throw new Error(response.message || 'Unable to send OTP');
      }

      setOtpSent(true);
      setOtpMessage({
        type: 'success',
        text: response.data?.otp
          ? `OTP sent. Development OTP: ${response.data.otp}`
          : 'OTP sent to your mobile number',
      });
      await refreshUser();
    } catch (error) {
      setOtpMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to send OTP',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    setOtpMessage(null);

    try {
      const response = await authApi.verifyPhoneOtp(phone, otp);

      if (!response.success) {
        throw new Error(response.message || 'Unable to verify OTP');
      }

      setOtp('');
      setOtpSent(false);
      setOtpMessage({ type: 'success', text: 'Mobile number verified successfully' });
      await refreshUser();
    } catch (error) {
      setOtpMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to verify OTP',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'library' || !isAuthenticated) return;

    let ignore = false;
    setLibraryLoading(true);

    libraryApi
      .getMyLibrary()
      .then((response) => {
        if (!ignore && response.success) {
          setLibraryItems(response.data);
        }
      })
      .catch(() => {
        if (!ignore) setLibraryItems([]);
      })
      .finally(() => {
        if (!ignore) setLibraryLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (activeTab !== 'saved' || !isAuthenticated) return;

    let ignore = false;
    setSavedBooksLoading(true);

    authApi
      .getSavedBooks()
      .then((response) => {
        if (!ignore && response.success) {
          setSavedBooks(response.data || []);
        }
      })
      .catch(() => {
        if (!ignore) setSavedBooks([]);
      })
      .finally(() => {
        if (!ignore) setSavedBooksLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return null;
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-lg shadow-sm"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32"></div>
          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-4">
              <div className="w-32 h-32 rounded-2xl bg-white p-2 shadow-lg">
                <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden flex items-center justify-center text-white text-4xl font-bold">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                      <div className="h-7 w-7 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    </div>
                  )}
                  <label className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-white text-blue-700 shadow-lg flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors">
                    <CameraIcon className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={avatarUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {avatarError && (
                <p className="mt-3 text-sm font-medium text-red-600">{avatarError}</p>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                    {user.role}
                  </span>
                  {user.subscriptionPlan && user.subscriptionPlan !== 'none' && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium capitalize">
                      {user.subscriptionPlan} Plan
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Link
                  href="/subscription"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  {user.subscriptionPlan && user.subscriptionPlan !== 'none' ? 'Manage Plan' : 'Subscribe'}
                </Link>
                <button
                  onClick={() => logout()}
                  className="px-6 py-2.5 border border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="border-b border-gray-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'overview' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'subscription' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Subscription
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'orders' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Orders
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'saved'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Saved Books
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'library'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Library
              </button>
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Member Since</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                    <StarIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Subscription</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {user.subscriptionPlan && user.subscriptionPlan !== 'none' 
                      ? user.subscriptionPlan 
                      : 'Free'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <BookOpenIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Books Access</p>
                  <p className="font-semibold text-gray-900">
                    {user.subscriptionPlan === 'pro' ? 'Unlimited' : 
                     user.subscriptionPlan === 'premium' ? 'Premium + Standard' :
                     user.subscriptionPlan === 'basic' ? 'Standard Only' : 'Limited'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <EnvelopeIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Email Status</p>
                  <p className="font-semibold text-gray-900">
                    {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <PhoneIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Mobile Status</p>
                  <p className="font-semibold text-gray-900">
                    {user.isPhoneVerified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Current Subscription</h3>
                {user.subscriptionPlan && user.subscriptionPlan !== 'none' ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold capitalize mb-2">
                          {user.subscriptionPlan}
                        </span>
                        <p className="text-gray-600">Status: <span className="font-semibold text-green-600 capitalize">{user.subscriptionStatus}</span></p>
                        {user.subscriptionEndDate && (
                          <p className="text-gray-600 mt-1">
                            Valid until: {new Date(user.subscriptionEndDate).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        )}
                      </div>
                      <Link
                        href="/subscription"
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Upgrade/Manage
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-600 mb-4">You don't have an active subscription</p>
                    <Link
                      href="/subscription"
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      View Plans
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No orders yet</p>
                <p className="text-gray-500 text-sm mb-4">Start exploring our book collection</p>
                <Link
                  href="/books"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Browse Books
                </Link>
              </div>
            )}

            {activeTab === 'saved' && (
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Saved Books</h3>
                    <p className="text-sm text-gray-500">Books you saved for later</p>
                  </div>
                  <Link
                    href="/books"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    Browse
                  </Link>
                </div>

                {savedBooksLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="h-10 w-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                  </div>
                ) : savedBooks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <BookmarkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No saved books yet</p>
                    <p className="text-gray-500 text-sm mb-4">Tap Save on any book to find it here later</p>
                    <Link
                      href="/books"
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Browse Books
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {savedBooks.map((savedBook) => {
                      const rawBook = typeof savedBook.bookId === 'object' ? savedBook.bookId : null;
                      const title = savedBook.title || rawBook?.title || 'Saved Book';
                      const slug = savedBook.slug || rawBook?.slug || savedBook.id || savedBook._id || generateBookSlug(title);
                      const image = savedBook.image || (rawBook as any)?.image;

                      return (
                        <Link
                          key={savedBook.id || savedBook._id || slug}
                          href={`/books/${slug}`}
                          className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                          <div className="relative h-44 bg-gray-100">
                            {image ? (
                              <Image
                                src={image}
                                alt={title}
                                fill
                                className="object-contain p-3"
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center text-gray-400">
                                <BookOpenIcon className="w-10 h-10" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            {savedBook.category && (
                              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                {savedBook.category}
                              </span>
                            )}
                            <h4 className="mt-2 font-bold text-gray-900 line-clamp-2 group-hover:text-blue-700">
                              {title}
                            </h4>
                            {savedBook.author && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{savedBook.author}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-3">
                              Saved {new Date(savedBook.savedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'library' && (
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">My Library</h3>
                    <p className="text-sm text-gray-500">Your purchased and claimed ebooks and audiobooks</p>
                  </div>
                  <Link
                    href="/books"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    Browse
                  </Link>
                </div>

                {libraryLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="h-10 w-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                  </div>
                ) : libraryItems.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Your library is empty</p>
                    <p className="text-gray-500 text-sm mb-4">Claim a free item or buy a book to see it here</p>
                    <Link
                      href="/books"
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Browse Books
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {libraryItems.map((item) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="relative h-44 bg-gray-100">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-contain p-3"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                              <BookOpenIcon className="w-10 h-10" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                              {item.format || (item.itemType === 'audiobook' ? 'Audiobook' : 'Ebook')}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">{item.accessMode}</span>
                          </div>
                          <h4 className="font-bold text-gray-900 line-clamp-2">{item.title}</h4>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.author}</p>
                          <Link
                            href={item.redirectTarget}
                            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            {item.itemType === 'audiobook' ? 'Listen' : 'Read'}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
