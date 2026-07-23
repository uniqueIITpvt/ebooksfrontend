'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/primitives/Button';
import { generateBookSlug } from '@/utils/slugify';
import { authApi } from '@/services/api/authApi';
import { LibraryCardDesktop, LibraryCardMobile } from '@/components/ui/cards/LibraryCard';
import {
  ArrowLeftIcon,
  BookmarkIcon as BookmarkIconOutline,
  FunnelIcon,
  MagnifyingGlassIcon,
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
  const formatDisplayPrice = (price?: string | null) => {
    if (!price) return null;
    return `₹${price.replace(/^[^0-9.]*/, '').replace(/\.00$/, '')}`;
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

  const handleSaveBook = async (item: T) => {
    const identifier = item.slug || item.id || item._id;
    if (!identifier) return;

    const href = getHref(item);
    if (!user) {
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
    const isFreeSummaryCard = defaultMetaLabel === 'Free Summary';
    const isFreeItem =
      isFreeSummaryCard ||
      (item.price ? (Number.parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0) <= 0 : false);
    const isSaving = savingId === itemId;
    const isSaved = isItemSaved(item);
    const hasUniquePlus =
      !!user?.subscriptionPlan &&
      user.subscriptionPlan !== 'none';
    const keepForeverTarget = getHref(item);
    const displayPrice = formatDisplayPrice(item.price);
    const priceLine = isFreeItem ? null : (
      <>
        {hasUniquePlus ? 'Read ' : <>{displayPrice ? `${displayPrice} or ` : ''}</>}
        <span className='font-semibold text-[#16A34A]'>Free</span>
        {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
      </>
    );

    const handlePrimaryClick = () => {
      if (isFreeItem) {
        router.push(getHref(item));
        return;
      }

      if (!user) {
        const returnTo =
          typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : '/';
        openAuthModal('signin', `/subscription?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      router.push(hasUniquePlus ? keepForeverTarget : '/subscription');
    };
    const handleCoverClick = () => router.push(getHref(item));
    const handleSaveClick = () => void handleSaveBook(item);
    const primaryLabel = isFreeItem ? 'Read Free' : hasUniquePlus ? `${displayPrice || ''} Keep Forever`.trim() : 'Read with Unique Plus';
    const primaryVariant = isFreeItem ? 'free' : hasUniquePlus ? 'keep-forever' : 'unique-plus';

    return (
      <div key={itemId} className='contents'>
        <LibraryCardDesktop
          image={item.image}
          title={item.title}
          author={item.author}
          rating={item.rating}
          reviews={item.reviews}
          priceLine={priceLine}
          primaryLabel={primaryLabel}
          primaryVariant={primaryVariant}
          onPrimaryClick={handlePrimaryClick}
          onCoverClick={handleCoverClick}
          isSaved={isSaved}
          onSaveClick={handleSaveClick}
          saveDisabled={isSaving}
          saveLabel={`Save ${item.title}`}
          coverVariant='book'
          className='hidden sm:flex'
        />
        <LibraryCardMobile
          image={item.image}
          title={item.title}
          author={item.author}
          rating={item.rating}
          reviews={item.reviews}
          priceLine={priceLine}
          primaryLabel={primaryLabel}
          primaryVariant={primaryVariant}
          onPrimaryClick={handlePrimaryClick}
          onCoverClick={handleCoverClick}
          isSaved={isSaved}
          onSaveClick={handleSaveClick}
          saveDisabled={isSaving}
          saveLabel={`Save ${item.title}`}
          coverVariant='book'
          className='sm:hidden'
        />
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
