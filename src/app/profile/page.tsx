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
  CheckCircleIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';
import { libraryApi, type LibraryItem } from '@/services/api/libraryApi';
import { authApi, type SavedBook, type UserSubscription } from '@/services/api/authApi';
import { API_CONFIG } from '@/config/api';
import { tokenStore } from '@/services/api/tokenStore';
import { generateBookSlug } from '@/utils/slugify';
import { formatSubscriptionPlanLabel, hasActiveSubscription } from '@/lib/subscription';
import InvoiceModal, { type InvoiceRecord } from '@/components/invoice/InvoiceModal';

type ProfilePayment = {
  _id: string;
  paymentType?: string;
  itemType?: string;
  itemName?: string;
  status?: string;
  totalAmount?: number;
  paidAt?: string;
  createdAt?: string;
};

export default function UserProfilePage() {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'owned' | 'saved' | 'library' | 'orders'>('overview');
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryProgress, setLibraryProgress] = useState<Record<string, number>>({});
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [savedBooksLoaded, setSavedBooksLoaded] = useState(false);
  const [savedBooksLoading, setSavedBooksLoading] = useState(false);
  const [savedBookMenuOpen, setSavedBookMenuOpen] = useState<string | null>(null);
  const [removingSavedBookId, setRemovingSavedBookId] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const [profilePayments, setProfilePayments] = useState<ProfilePayment[]>([]);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const hasUserActiveSubscription = hasActiveSubscription(user);
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [selectedInvoicePaymentId, setSelectedInvoicePaymentId] = useState<string | null>(null);

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
    const requestedTab = params.get('tab');
    if (requestedTab === 'subscription' || requestedTab === 'owned' || requestedTab === 'orders' || requestedTab === 'saved' || requestedTab === 'library') {
      setActiveTab(requestedTab);
    }
  }, []);

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
    if (!['overview', 'subscription', 'owned', 'library'].includes(activeTab) || !isAuthenticated) return;
    if (libraryLoaded) return;

    let ignore = false;
    setLibraryLoading(true);

    libraryApi
      .getMyLibrary()
      .then((response) => {
        if (!ignore && response.success) {
          setLibraryItems(response.data);
          setLibraryLoaded(true);
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
  }, [activeTab, isAuthenticated, libraryLoaded]);

  useEffect(() => {
    const progressByItem: Record<string, number> = {};

    libraryItems.forEach((item) => {
      if (!item.slug) return;

      try {
        const rawProgress = localStorage.getItem(`techuniqueiit:ebook-reader:${item.slug}`);
        if (!rawProgress) return;

        const parsed = JSON.parse(rawProgress) as { completed?: number };
        progressByItem[item.id] = Math.max(0, Math.min(100, Number(parsed.completed) || 0));
      } catch {}
    });

    setLibraryProgress(progressByItem);
  }, [libraryItems]);

  useEffect(() => {
    if (activeTab !== 'saved' || !isAuthenticated) return;
    if (savedBooksLoaded) return;

    let ignore = false;
    setSavedBooksLoading(true);

    authApi
      .getSavedBooks()
      .then((response) => {
        if (!ignore && response.success) {
          setSavedBooks(response.data || []);
          setSavedBooksLoaded(true);
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
  }, [activeTab, isAuthenticated, savedBooksLoaded]);

  useEffect(() => {
    if (activeTab !== 'subscription' || !isAuthenticated || !hasUserActiveSubscription) {
      setCurrentSubscription(null);
      return;
    }
    if (subscriptionLoaded) return;

    let ignore = false;
    setSubscriptionLoading(true);
    setSubscriptionMessage(null);

    authApi
      .getMySubscription()
      .then((response) => {
        if (ignore) return;

        if (response.success) {
          setCurrentSubscription(response.data ?? null);
          setSubscriptionLoaded(true);
          return;
        }

        setSubscriptionMessage({
          type: 'error',
          text: response.message || 'Unable to load subscription details',
        });
      })
      .catch(() => {
        if (!ignore) {
          setSubscriptionMessage({
            type: 'error',
            text: 'Unable to load subscription details',
          });
        }
      })
      .finally(() => {
        if (!ignore) setSubscriptionLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, isAuthenticated, hasUserActiveSubscription, subscriptionLoaded]);

  useEffect(() => {
    if (activeTab !== 'subscription' || !isAuthenticated) return;
    if (paymentsLoaded) return;

    let ignore = false;
    setPaymentsLoading(true);

    const token = tokenStore.getAccessToken();
    fetch(`${API_CONFIG.API_BASE_URL}/payments/my-payments`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (!ignore && data.success) {
          setProfilePayments(data.data || []);
          setPaymentsLoaded(true);
        }
      })
      .catch(() => {
        if (!ignore) setProfilePayments([]);
      })
      .finally(() => {
        if (!ignore) setPaymentsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, isAuthenticated, paymentsLoaded]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleRemoveSavedBook = async (savedBook: SavedBook) => {
    const title = savedBook.title || (typeof savedBook.bookId === 'object' ? savedBook.bookId?.title : '') || 'Saved Book';
    const identifier =
      savedBook.slug ||
      (typeof savedBook.bookId === 'object' ? savedBook.bookId?.slug || savedBook.bookId?.id || savedBook.bookId?._id : savedBook.bookId) ||
      savedBook.id ||
      savedBook._id ||
      generateBookSlug(title);
    const itemKey = savedBook.id || savedBook._id || identifier;

    if (!identifier) return;

    setRemovingSavedBookId(itemKey);
    setSavedBookMenuOpen(null);

    try {
      const response = await authApi.toggleSavedBook(identifier);
      if (response.success) {
        if (response.data?.savedBooks) {
          setSavedBooks(response.data.savedBooks);
        } else {
          setSavedBooks((current) =>
            current.filter((item) => (item.id || item._id || item.slug) !== itemKey)
          );
        }
        await refreshUser();
      }
    } catch (error) {
      alert('Unable to remove saved book');
    } finally {
      setRemovingSavedBookId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription?._id || subscriptionActionLoading) return;

    const shouldCancel = window.confirm('Cancel your current subscription plan?');
    if (!shouldCancel) return;

    setSubscriptionActionLoading(true);
    setSubscriptionMessage(null);

    try {
      const response = await authApi.cancelSubscription(currentSubscription._id);

      if (!response.success) {
        throw new Error(response.message || 'Unable to cancel subscription');
      }

      setCurrentSubscription(null);
      setSubscriptionMessage({
        type: 'success',
        text: 'Subscription cancelled successfully',
      });
      await refreshUser();
    } catch (error) {
      setSubscriptionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to cancel subscription',
      });
    } finally {
      setSubscriptionActionLoading(false);
    }
  };

  const handleProfileBack = () => {
    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        if (
          referrerUrl.origin === window.location.origin &&
          referrerUrl.pathname !== '/profile' &&
          referrerUrl.pathname !== '/'
        ) {
          router.push(`${referrerUrl.pathname}${referrerUrl.search}`);
          return;
        }
      } catch {}
    }

    router.push('/');
  };

  const handleViewInvoice = async (paymentId?: string | null) => {
    if (!paymentId) return;

    setInvoiceOpen(true);
    setInvoiceLoading(true);
    setSelectedInvoice(null);
    setSelectedInvoicePaymentId(paymentId);

    try {
      const token = tokenStore.getAccessToken();
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/payments/${paymentId}/invoice`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error?.message || 'Unable to load invoice');
      }
      setSelectedInvoice(data.data);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to load invoice');
      setInvoiceOpen(false);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return null;
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-50 via-indigo-50 to-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  const planLabel = hasUserActiveSubscription ? `${user.subscriptionPlan} Plan` : 'Free Plan';
  const latestSubscriptionPayment = profilePayments.find(
    (payment) => payment.paymentType === 'subscription' && (payment.status === 'completed' || payment.status === 'refunded')
  );
  const booksAccessLabel =
    hasUserActiveSubscription && user.subscriptionPlan === 'pro' ? 'Unlimited' :
    hasUserActiveSubscription && user.subscriptionPlan === 'premium' ? 'Premium + Standard' :
    hasUserActiveSubscription && user.subscriptionPlan === 'basic' ? 'Standard Only' : 'Limited';
  const profileStats = [
    {
      label: 'Books in Library',
      value: libraryItems.length || 0,
      icon: BookOpenIcon,
      iconWrap: 'bg-blue-100 text-blue-600',
      action: 'View Library',
      tab: 'library' as const,
    },
    {
      label: 'Currently Reading',
      value: libraryItems.length || 0,
      icon: BookOpenIcon,
      iconWrap: 'bg-emerald-100 text-emerald-600',
      action: 'Continue Reading',
      tab: 'library' as const,
    },
    {
      label: 'Saved Books',
      value: savedBooks.length || 0,
      icon: StarIcon,
      iconWrap: 'bg-amber-100 text-amber-600',
      action: 'View Saved',
      tab: 'saved' as const,
    },
    {
      label: 'Books Access',
      value: booksAccessLabel,
      icon: CheckCircleIcon,
      iconWrap: 'bg-indigo-100 text-indigo-600',
      action: 'View Plan',
      tab: 'subscription' as const,
    },
  ];
  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'subscription' as const, label: 'Subscription' },
    { key: 'owned' as const, label: 'Owned' },
    { key: 'orders' as const, label: 'My Orders' },
    { key: 'saved' as const, label: 'Saved Books' },
    { key: 'library' as const, label: 'My Library' },
  ];
  const ownedLibraryItems = libraryItems.filter(
    (item) => item.accessMode === 'purchase' && item.status === 'active'
  );
  const filteredLibraryItems = libraryItems.filter((item) => {
    const query = librarySearch.trim().toLowerCase();
    if (!query) return true;

    return [item.title, item.author, item.category, item.format]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const getLibraryReadTarget = (item: LibraryItem, returnTo = '/profile?tab=library') => {
    if (item.itemType === 'audiobook') {
      return item.redirectTarget;
    }

    const slug = item.slug || item.redirectTarget.match(/\/books\/([^/]+)\/read/)?.[1] || item.itemId;
    return `/read/${slug}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 via-indigo-50 to-white pb-12 pt-3">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-3">
          <button
            onClick={handleProfileBack}
            className="flex items-center gap-2 rounded-lg border border-blue-100 bg-white/90 px-3 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:bg-white hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="mb-5 rounded-xl border border-blue-100/80 bg-white/85 p-4 shadow-sm backdrop-blur">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative h-[92px] w-[92px] shrink-0 rounded-2xl bg-white p-2 shadow-md ring-1 ring-blue-100">
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-bold text-white">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    fill
                    className="object-cover"
                    sizes="92px"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  </div>
                )}
                <label className="absolute bottom-1 right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-blue-700 shadow-md transition-colors hover:bg-blue-50">
                  <CameraIcon className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                    className="hidden"
                  />
                </label>
                </div>
                {avatarError && (
                  <p className="absolute left-0 top-full mt-2 w-64 text-sm font-medium text-red-600">{avatarError}</p>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Hello, {user.name}</h1>
                  {hasUserActiveSubscription && (
                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                      Premium Member
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-500">{user.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                    {user.role}
                  </span>
                  {hasUserActiveSubscription && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Verified
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-blue-100">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Member Since {memberSince}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
                  <StarIcon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-blue-100">
                  Current Plan
                </span>
              </div>
              <h2 className="mt-3 text-lg font-bold capitalize text-slate-950">{planLabel}</h2>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Next Billing Date</p>
                  <p className="font-bold text-slate-950">
                    {user.subscriptionEndDate
                      ? new Date(user.subscriptionEndDate).toLocaleDateString('en-US', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Not Active'}
                  </p>
                </div>
                <Link
                  href="/subscription"
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                >
                  Manage Plan
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {profileStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => setActiveTab(stat.tab)}
                  className="min-h-[118px] rounded-xl border border-blue-100 bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconWrap}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-lg font-bold text-slate-950">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-xs font-bold text-blue-700">{stat.action} -&gt;</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 grid overflow-hidden rounded-xl border border-blue-100/80 bg-white/85 shadow-sm backdrop-blur lg:grid-cols-[180px_1fr]">
          <aside className="hidden border-r border-blue-100 bg-white/75 p-3 lg:block">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors ${
                    activeTab === tab.key
                      ? 'bg-indigo-50 text-blue-700'
                      : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="mt-6 border-t border-blue-100 pt-3">
              <Link
                href="/faq"
                className="block rounded-lg px-3 py-2.5 text-xs font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-700"
              >
                Help & Support
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="mt-1 block w-full rounded-lg px-3 py-2.5 text-left text-xs font-bold text-red-500 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </aside>

          <div className="min-w-0">
          <div className="border-b border-gray-100 lg:hidden">
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 rounded-lg px-4 py-2.5 text-xs font-bold transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-gray-500 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="rounded-xl border border-blue-100/70 bg-white/75 p-6">
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

                <div className="rounded-xl border border-blue-100/70 bg-white/75 p-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                    <StarIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Subscription</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {hasUserActiveSubscription
                      ? user.subscriptionPlan 
                      : 'Free'}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100/70 bg-white/75 p-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <BookOpenIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Books Access</p>
                  <p className="font-semibold text-gray-900">
                    {hasUserActiveSubscription && user.subscriptionPlan === 'pro' ? 'Unlimited' :
                     hasUserActiveSubscription && user.subscriptionPlan === 'premium' ? 'Premium + Standard' :
                     hasUserActiveSubscription && user.subscriptionPlan === 'basic' ? 'Standard Only' : 'Limited'}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100/70 bg-white/75 p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <EnvelopeIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Email Status</p>
                  <p className="font-semibold text-gray-900">
                    {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100/70 bg-white/75 p-6">
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
                {subscriptionMessage && (
                  <p
                    className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
                      subscriptionMessage.type === 'success'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {subscriptionMessage.text}
                  </p>
                )}
                {hasUserActiveSubscription ? (
                  <div className="rounded-xl border border-blue-100 bg-white/75 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold capitalize mb-2">
                          {user.subscriptionPlan}
                        </span>
                        <p className="text-gray-600">
                          Status:{' '}
                          <span className="font-semibold text-green-600">
                            {formatSubscriptionPlanLabel(user.subscriptionPlan)}
                          </span>
                        </p>
                        {user.subscriptionEndDate && (
                          <p className="text-gray-600 mt-1">
                            Valid until: {new Date(user.subscriptionEndDate).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        )}
                        {subscriptionLoading && (
                          <p className="text-gray-500 mt-1">Loading plan details...</p>
                        )}
                      </div>
                      <div className="flex flex-wrap justify-end gap-3">
                        <Link
                          href="/subscription"
                          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Upgrade/Manage
                        </Link>
                        {latestSubscriptionPayment && (
                          <button
                            type="button"
                            onClick={() => handleViewInvoice(latestSubscriptionPayment._id)}
                            disabled={paymentsLoading}
                            className="px-6 py-2.5 border border-blue-300 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                          >
                            Invoice
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCancelSubscription}
                          disabled={!currentSubscription?._id || subscriptionLoading || subscriptionActionLoading}
                          className="px-6 py-2.5 border border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                        >
                          {subscriptionActionLoading ? 'Cancelling...' : 'Cancel Plan'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-blue-100/70 bg-white/75 py-12 text-center">
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

            {activeTab === 'owned' && (
              <div>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Owned Books</h3>
                    <p className="text-xs text-gray-500">Books you purchased permanently with lifetime access.</p>
                  </div>
                  <Link
                    href="/books"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Browse
                  </Link>
                </div>

                {libraryLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="h-10 w-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                  </div>
                ) : ownedLibraryItems.length === 0 ? (
                  <div className="rounded-xl border border-blue-100/70 bg-white/75 py-12 text-center">
                    <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No permanently owned books yet</p>
                    <p className="text-gray-500 text-sm mb-4">Books you buy with Keep Forever will appear here.</p>
                    <Link
                      href="/books"
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Browse Books
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {ownedLibraryItems.map((item) => {
                      const readTarget = getLibraryReadTarget(item, '/profile?tab=owned');
                      const detailsTarget = item.slug ? `/books/${item.slug}` : item.redirectTarget.replace(/\/read$/, '');

                      return (
                        <article
                          key={item.id}
                          className="overflow-hidden rounded-xl border border-blue-100/80 bg-white/85 shadow-sm"
                        >
                          <div className="flex gap-4 p-4">
                            <div className="relative flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  className="object-contain p-2"
                                  sizes="80px"
                                />
                              ) : (
                                <BookOpenIcon className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                  Lifetime Access
                                </span>
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                                  ZIP Download
                                </span>
                              </div>
                              <h4 className="line-clamp-2 text-sm font-bold text-slate-950">{item.title}</h4>
                              <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.author || 'UniqueIIT Research Center'}</p>
                              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                                <div>
                                  <p className="font-semibold text-slate-400">Access</p>
                                  <p className="font-bold text-slate-700">Owned</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-400">Purchased</p>
                                  <p className="font-bold text-slate-700">
                                    {item.createdAt
                                      ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        })
                                      : 'Available'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={`${item.paymentId ? 'grid-cols-3' : 'grid-cols-2'} grid gap-2 border-t border-blue-100 bg-blue-50/40 p-3`}>
                            <button
                              type="button"
                              onClick={() => router.push(readTarget)}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                            >
                              Read Now
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push(detailsTarget)}
                              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                            >
                              Access Details
                            </button>
                            {item.paymentId && (
                              <button
                                type="button"
                                onClick={() => handleViewInvoice(item.paymentId)}
                                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                              >
                                Invoice
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="rounded-xl border border-blue-100/70 bg-white/75 py-12 text-center">
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
                    <h3 className="text-base font-bold text-gray-900">Saved Books</h3>
                    <p className="text-xs text-gray-500">Books you saved for later</p>
                  </div>
                  <Link
                    href="/books"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Browse
                  </Link>
                </div>

                {savedBooksLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="h-10 w-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                  </div>
                ) : savedBooks.length === 0 ? (
                  <div className="rounded-xl border border-blue-100/70 bg-white/75 py-12 text-center">
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {savedBooks.map((savedBook) => {
                      const rawBook = typeof savedBook.bookId === 'object' ? savedBook.bookId : null;
                      const title = savedBook.title || rawBook?.title || 'Saved Book';
                      const slug = savedBook.slug || rawBook?.slug || savedBook.id || savedBook._id || generateBookSlug(title);
                      const image = savedBook.image || (rawBook as any)?.image;

                      const itemKey = savedBook.id || savedBook._id || slug;

                      return (
                        <article
                          key={itemKey}
                          className="group relative overflow-hidden rounded-xl border border-blue-100/80 bg-white/80 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setSavedBookMenuOpen((current) => (current === itemKey ? null : itemKey));
                            }}
                            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900"
                            aria-label={`More actions for ${title}`}
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </button>

                          {savedBookMenuOpen === itemKey && (
                            <div className="absolute right-3 top-14 z-30 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  void handleRemoveSavedBook(savedBook);
                                }}
                                disabled={removingSavedBookId === itemKey}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <TrashIcon className="h-4 w-4" />
                                {removingSavedBookId === itemKey ? 'Removing...' : 'Remove'}
                              </button>
                            </div>
                          )}

                          <Link href={`/books/${slug}`} className="block">
                            <div className="relative h-36 bg-blue-50/70">
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
                          </Link>
                          <div className="p-3">
                            {savedBook.category && (
                              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                {savedBook.category}
                              </span>
                            )}
                            <Link href={`/books/${slug}`}>
                              <h4 className="mt-2 text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-blue-700">
                                {title}
                              </h4>
                            </Link>
                            {savedBook.author && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{savedBook.author}</p>
                            )}
                            <p className="mt-2 text-xs text-gray-400">
                              Saved {new Date(savedBook.savedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'library' && (
              <div>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">My Library</h3>
                    <p className="text-xs text-gray-500">All your purchased and subscription books in one place.</p>
                  </div>
                  <Link
                    href="/books"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Browse
                  </Link>
                </div>

                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex h-10 w-full max-w-md items-center gap-2 rounded-lg border border-blue-100 bg-white px-3">
                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                    <input
                      value={librarySearch}
                      onChange={(event) => setLibrarySearch(event.target.value)}
                      placeholder="Search your library..."
                      className="h-full min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['All Books', 'In Progress', 'Completed', 'Purchased', 'Subscription', 'Saved'].map((filter, index) => (
                      <button
                        key={filter}
                        type="button"
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                          index === 0 ? 'bg-blue-600 text-white' : 'bg-blue-50 text-slate-500 hover:text-blue-700'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {libraryLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="h-10 w-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                  </div>
                ) : filteredLibraryItems.length === 0 ? (
                  <div className="rounded-xl border border-blue-100/70 bg-white/75 py-12 text-center">
                    <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {libraryItems.length ? 'No library books match your search' : 'Your library is empty'}
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      {libraryItems.length ? 'Try another title, author, or category' : 'Claim a free item or buy a book to see it here'}
                    </p>
                    <Link
                      href="/books"
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Browse Books
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {filteredLibraryItems.map((item) => {
                      const progress = libraryProgress[item.id] ?? 0;
                      const completed = progress >= 100;
                      const readTarget = getLibraryReadTarget(item);
                      const actionLabel = item.itemType === 'audiobook'
                        ? 'Listen'
                        : progress > 0
                          ? 'Continue Reading'
                          : 'Read Again';

                      return (
                      <div
                        key={item.id}
                        role="link"
                        tabIndex={0}
                        onClick={() => router.push(readTarget)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            router.push(readTarget);
                          }
                        }}
                        className="cursor-pointer overflow-hidden rounded-xl border border-blue-100/80 bg-white shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="relative flex h-28 items-center justify-center bg-blue-50/70">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              width={86}
                              height={112}
                              className="max-h-[98px] w-auto object-contain"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                              <BookOpenIcon className="w-10 h-10" />
                            </div>
                          )}
                          <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold ${
                            completed ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 ring-1 ring-blue-100'
                          }`}>
                            {completed ? 'Finished' : item.accessMode}
                          </span>
                        </div>
                        <div className="p-2.5">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                              {item.format || (item.itemType === 'audiobook' ? 'Audiobook' : 'Ebook')}
                            </span>
                            <button
                              type="button"
                              onClick={(event) => event.stopPropagation()}
                              className="rounded-full p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-700"
                              aria-label={`More options for ${item.title}`}
                            >
                              <EllipsisVerticalIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <h4 className="line-clamp-2 text-[13px] font-bold leading-5 text-gray-900">{item.title}</h4>
                          <p className="mt-1 line-clamp-1 text-xs text-gray-500">{item.author}</p>
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                              <span>{progress}% Completed</span>
                              <span>{completed ? 'Completed' : 'In Progress'}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                              <div
                                className="h-full rounded-full bg-blue-600 transition-all"
                                style={{ width: `${Math.max(progress, progress > 0 ? progress : 8)}%` }}
                              />
                            </div>
                            <p className="mt-2 text-[10px] text-slate-400">
                              {progress > 0 ? 'Last opened recently' : 'Not started yet'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(readTarget);
                            }}
                            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            {actionLabel}
                          </button>
                          {item.paymentId && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleViewInvoice(item.paymentId);
                              }}
                              className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              Invoice
                            </button>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
      <InvoiceModal
        open={invoiceOpen}
        loading={invoiceLoading}
        invoice={selectedInvoice}
        paymentId={selectedInvoicePaymentId}
        onClose={() => setInvoiceOpen(false)}
      />
    </div>
  );
}
