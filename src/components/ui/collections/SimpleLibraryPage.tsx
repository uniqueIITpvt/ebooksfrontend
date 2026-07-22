'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/primitives/Button';
import { generateBookSlug } from '@/utils/slugify';
import { libraryApi } from '@/services/api/libraryApi';
import { tokenStore } from '@/services/api/tokenStore';
import { authApi } from '@/services/api/authApi';
import {
  ArrowLeftIcon,
  BookmarkIcon as BookmarkIconOutline,
  FunnelIcon,
  MagnifyingGlassIcon,
  StarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export interface SimpleLibraryItem {
  id?: string;
  _id?: string;
  slug?: string;
  title: string;
  author: string;
  description: string;
  category: string;
  language?: string;
  image?: string | null;
  featured?: boolean;
  pages?: number;
  readingTime?: string;
  views?: number;
  sales?: number;
  isActive?: boolean;
  price?: string;
  originalPrice?: string | null;
  rating?: number;
  reviews?: number;
}

interface SimpleLibraryPageProps<T extends SimpleLibraryItem> {
  title: string;
  items: T[];
  searchPlaceholder: string;
  emptyMessage: string;
  detailBasePath: string;
  defaultMetaLabel: string;
  variant?: 'glass' | 'card' | 'landing';
}

export default function SimpleLibraryPage<T extends SimpleLibraryItem>({
  title,
  items,
  searchPlaceholder,
  emptyMessage,
  detailBasePath,
  defaultMetaLabel,
  variant = 'glass',
}: SimpleLibraryPageProps<T>) {
  const router = useRouter();
  const { openAuthModal, refreshUser, user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({});

  const categories = useMemo(() => {
    return [...new Set(items.map((item) => item.category))];
  }, [items]);

  const categoryCounts = useMemo(
    () =>
      items.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[item.category] = (accumulator[item.category] ?? 0) + 1;
        return accumulator;
      }, {}),
    [items]
  );

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(item.category);
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const hasActiveFilters = searchTerm !== '' || selectedCategories.length > 0;

  const getItemId = (item: T) => item._id || item.id || item.slug || item.title;
  const getHref = (item: T) => `${detailBasePath}/${item.slug || item._id || item.id}`;
  const getMeta = (item: T) =>
    item.pages ? `${item.pages} pages` : item.readingTime || defaultMetaLabel;
  const formatPrice = (price?: string | null) => {
    if (!price) return null;
    return `₹${price.replace(/^[₹$]/, '')}`;
  };
  const isItemSaved = (item: T) => {
    const itemId = getItemId(item);
    const override = savedOverrides[itemId];
    if (override !== undefined) return override;

    const itemKeys = [item.slug, item.id, item._id, item.title, generateBookSlug(item.title)]
      .filter(Boolean)
      .map(String);

    return (user?.savedBooks || []).some((savedBook) => {
      const rawBook = typeof savedBook.bookId === 'object' ? savedBook.bookId : null;
      const savedKeys = [
        savedBook.slug,
        savedBook.id,
        savedBook._id,
        savedBook.title,
        typeof savedBook.bookId === 'string' ? savedBook.bookId : undefined,
        rawBook?.slug,
        rawBook?.id,
        rawBook?._id,
        rawBook?.title,
      ].filter(Boolean).map(String);

      return itemKeys.some((key) => savedKeys.includes(key));
    });
  };

  const handleFreeSummaryClaim = async (item: T, navigateAfterClaim: boolean) => {
    const identifier = item.slug || item.id || item._id;
    if (!identifier) return;

    const href = getHref(item);
    const token = tokenStore.getAccessToken();

    if (!token) {
      openAuthModal('signin', href);
      return;
    }

    setClaimingId(getItemId(item));
    try {
      const response = await libraryApi.claim(identifier);
      const nextReadTarget = `/read/${response.bookSlug || identifier}`;
      window.dispatchEvent(new Event('library:changed'));
      if (navigateAfterClaim) {
        router.push(nextReadTarget);
      }
    } catch (error: any) {
      alert(error?.message || 'Unable to claim this item');
    } finally {
      setClaimingId(null);
    }
  };

  const handleSaveBook = async (item: T) => {
    const identifier = item.slug || item.id || item._id;
    if (!identifier) return;

    const href = getHref(item);
    const token = tokenStore.getAccessToken();

    if (!token) {
      openAuthModal('signin', href);
      return;
    }

    setSavingId(getItemId(item));
    try {
      const response = await authApi.toggleSavedBook(identifier);
      if (response.success) {
        const itemId = getItemId(item);
        setSavedOverrides((current) => ({
          ...current,
          [itemId]: response.data?.saved ?? !isItemSaved(item),
        }));
      }
      await refreshUser();
    } catch (error: any) {
      alert(error?.message || 'Unable to save this item');
    } finally {
      setSavingId(null);
    }
  };

  const renderGlassCard = (item: T) => (
    <div
      key={getItemId(item)}
      className='group relative w-full'
      style={{
        position: 'relative',
        height: '340px',
        borderRadius: '14px',
        zIndex: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
      }}
    >
      <div
        className="absolute z-[2] bg-white/95 backdrop-blur-[24px] rounded-[10px] overflow-hidden"
        style={{
          top: '5px',
          left: '5px',
          width: 'calc(100% - 10px)',
          height: 'calc(100% - 10px)',
          outline: '2px solid white',
        }}
      >
        <div className='relative w-full h-full overflow-hidden flex items-center justify-center p-0'>
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              className='object-cover object-center transition-transform duration-300 group-hover:scale-105'
              sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          <div className='absolute top-2 left-2'>
            <span className='bg-white/90 backdrop-blur-sm text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold shadow-sm'>
              {item.category}
            </span>
          </div>
        </div>

        <div className='absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-[3] rounded-[10px] flex flex-col justify-end'>
          <div className='p-4 text-white transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500'>
            <h3 className='text-lg font-bold mb-2 leading-tight'>{item.title}</h3>
            <p className='text-sm text-white/90 mb-3 leading-relaxed line-clamp-2'>
              {item.description}
            </p>
            <div className='text-xs text-white/80 mb-4'>
              <div className='font-medium'>{item.author}</div>
              <div>{getMeta(item)}</div>
            </div>
            <Link href={getHref(item)}>
              <Button variant="secondary" size="sm" fullWidth>
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCard = (item: T) => (
    <div
      key={getItemId(item)}
      className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}

        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold shadow-sm">
            {item.category}
          </span>
        </div>

        {item.featured && (
          <div className="absolute top-3 right-3">
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-sm">
              Featured
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">
          {item.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{item.author}</p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{getMeta(item)}</span>
        </div>

        <Link href={getHref(item)}>
          <Button variant="secondary" size="sm" fullWidth>
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );

  const renderLandingCard = (item: T) => {
    const itemId = getItemId(item);
    const filledStars = Math.round(item.rating || 0);
    const isFreeSummaryCard = defaultMetaLabel === 'Free Summary';
    const isClaiming = claimingId === itemId;
    const isSaving = savingId === itemId;
    const isSaved = isItemSaved(item);
    const hasUniquePlus =
      !!user?.subscriptionPlan &&
      user.subscriptionPlan !== 'none';
    const keepForeverTarget = `/checkout?id=${item.id || item._id || itemId}`;

    if (isFreeSummaryCard) {
      return (
        <div
          key={itemId}
          className='group flex flex-col overflow-visible rounded-lg bg-transparent px-3 py-4 transition-all duration-300 hover:-translate-y-1'
        >
          <Link href={getHref(item)} className='relative h-[260px] w-full overflow-hidden rounded-md bg-transparent'>
            {item.image ? (
              <Image
                src={item.image}
                alt={item.title}
                fill
                className='rounded-md object-contain object-center transition-transform duration-300 group-hover:scale-[1.02]'
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                }}
                quality={100}
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center'>
                <span className='text-sm text-slate-400'>No Image</span>
              </div>
            )}
          </Link>

          <div className='flex flex-1 flex-col gap-2 px-0 pb-0 pt-3 font-dm-sans'>
            <div>
              <Link href={getHref(item)}>
                <h3 className='truncate text-[16px] font-extrabold leading-snug text-[#141454] transition-colors hover:text-blue-700 font-dm-sans'>
                  {item.title}
                </h3>
              </Link>
              <p className='mt-2 line-clamp-1 text-sm font-medium text-slate-400 font-dm-sans'>
                {item.author}
              </p>
            </div>

            {(item.rating ?? 0) > 0 && (
              <div className='flex items-center gap-3'>
                <StarIconSolid className='h-5 w-5 text-blue-600' />
                <span className='text-base font-extrabold text-[#141454] font-dm-sans'>{(item.rating || 0).toFixed(1)}</span>
                <span className='text-sm font-medium text-slate-400 font-dm-sans'>({item.reviews || 0})</span>
              </div>
            )}

            <div className='mt-auto grid grid-cols-[minmax(0,1fr)_50px] gap-3'>
              <button
                type='button'
                onClick={() => void handleFreeSummaryClaim(item, true)}
                disabled={isClaiming}
                className='flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-extrabold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans'
              >
                {isClaiming ? 'Claiming...' : 'Read Free'}
              </button>
              <button
                type='button'
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleSaveBook(item);
                }}
                disabled={isSaving}
                className={`flex h-11 w-11 items-center justify-center rounded-lg border shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans ${isSaved
                    ? 'border-yellow-400 bg-yellow-400 text-white hover:bg-yellow-500'
                    : 'border-slate-200 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                aria-label={`Save ${item.title}`}
              >
                {isSaved ? <BookmarkIconSolid className='h-6 w-6' /> : <BookmarkIconOutline className='h-6 w-6' />}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={itemId}
        className='group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden'
      >
        <div className='relative aspect-[3/4] w-full overflow-hidden bg-slate-100'>
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              className='object-contain object-center transition-transform duration-300 group-hover:scale-[1.02]'
              quality={100}
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
              style={{
                imageRendering: 'auto',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
              }}
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              <span className='text-slate-400 text-sm'>No Image</span>
            </div>
          )}

        </div>

        <div className='p-3 flex flex-col gap-1.5 flex-1'>
          <div>
            <span className='inline-flex max-w-full items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700'>
              <span className='truncate'>{item.category}</span>
            </span>
          </div>
          <h3 className='text-[13px] font-bold text-slate-900 leading-snug line-clamp-2'>{item.title}</h3>
          <p className='text-[11px] text-slate-500 line-clamp-1'>{item.author}</p>

          {(item.rating ?? 0) > 0 && (
            <div className='flex items-center gap-0.5'>
              {Array.from({ length: 5 }).map((_, index) => (
                index < filledStars
                  ? <StarIconSolid key={index} className='w-3 h-3 text-amber-400' />
                  : <StarIcon key={index} className='w-3 h-3 text-slate-200' />
              ))}
              <span className='text-[10px] text-slate-400 ml-1'>({item.reviews || 0})</span>
            </div>
          )}

          {item.price && (
            <div className='flex items-center gap-1.5'>
              <span className='text-sm font-bold text-slate-900'>{formatPrice(item.price)}</span>
              {item.originalPrice && (
                <span className='text-[11px] text-slate-400 line-through'>{formatPrice(item.originalPrice)}</span>
              )}
            </div>
          )}

          <p className='text-[10px] text-slate-400'>{getMeta(item)}</p>

          <div className='mt-auto pt-2'>
            <button
              onClick={() => {
                if (!user) {
                  const returnTo =
                    typeof window !== 'undefined'
                      ? `${window.location.pathname}${window.location.search}`
                      : '/';
                  router.push(
                    `/user/auth?mode=signin&returnUrl=${encodeURIComponent(
                      `/subscription?returnTo=${encodeURIComponent(returnTo)}`
                    )}`
                  );
                  return;
                }

                router.push(hasUniquePlus ? keepForeverTarget : '/subscription');
              }}
              className={`w-full py-2 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                hasUniquePlus
                  ? 'bg-slate-950 hover:bg-slate-800'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {hasUniquePlus ? 'Keep Forever for ₹299' : 'Read with Unique Plus'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-gray-50 pt-10'>
      <div className="max-w-[1600px] mx-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        </div>

        <div className="lg:flex lg:gap-6 xl:gap-8 px-4 sm:px-6 lg:px-8 pb-12">
          <div className="lg:w-64 xl:w-72 lg:flex-shrink-0">
            <div className="h-full lg:h-auto bg-white border-r lg:border border-gray-200 lg:rounded-xl lg:shadow-sm flex flex-col">
              <div className="p-4 lg:p-6 border-b border-gray-200 bg-white lg:bg-gray-50 lg:rounded-t-xl sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FunnelIcon className="w-5 h-5 mr-2 text-gray-600" />
                    Filters
                  </h2>
                </div>
              </div>

              <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          value={category}
                          checked={selectedCategories.includes(category)}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setSelectedCategories([...selectedCategories, category]);
                            } else {
                              setSelectedCategories(selectedCategories.filter((value) => value !== category));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm text-gray-700">{category}</span>
                        <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {categoryCounts[category] ?? 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 lg:p-6 border-t border-gray-200 bg-white lg:bg-gray-50 lg:rounded-b-xl sticky bottom-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategories([]);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 lg:pt-6">
            <div className={`grid ${variant === 'glass' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-6`}>
              {filteredItems.length === 0 ? (
                <div className='col-span-full text-center py-12'>
                  <p className='text-slate-600'>{emptyMessage}</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  variant === 'landing'
                    ? renderLandingCard(item)
                    : variant === 'card'
                      ? renderCard(item)
                      : renderGlassCard(item)
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
