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
import { hasActiveSubscription } from '@/lib/subscription';
import { useOwnedLibraryAccess } from '@/hooks/useOwnedLibraryAccess';
import BooksSidebar from '@/components/ui/books/BooksSidebar';
import {
  ArrowLeftIcon,
  BookmarkIcon as BookmarkIconOutline,
  ChevronRightIcon,
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
  const [isFilterSidebarCollapsed, setIsFilterSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const { isOwned } = useOwnedLibraryAccess();

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

  const languages = useMemo(() => {
    return [...new Set(items.map((item) => item.language).filter(Boolean))] as string[];
  }, [items]);

  const languageCounts = useMemo(
    () =>
      items.reduce<Record<string, number>>((accumulator, item) => {
        if (item.language) {
          accumulator[item.language] = (accumulator[item.language] ?? 0) + 1;
        }
        return accumulator;
      }, {}),
    [items]
  );

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(item.category);
    const matchesLanguage =
      selectedLanguages.length === 0 || selectedLanguages.includes(item.language || '');
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesLanguage && matchesSearch;
  });

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
    const hasUniquePlus = hasActiveSubscription(user);
    const displayPrice = formatDisplayPrice(item.price);
    const hasKeepForeverAccess = !isFreeSummaryCard && isOwned(item, 'ebook');
    const priceLine = isFreeItem ? null : hasKeepForeverAccess ? (
      <span className='font-semibold text-[#16A34A]'>Owned</span>
    ) : (
      <>
        {hasUniquePlus ? 'Read ' : <>{displayPrice ? `${displayPrice} or ` : ''}</>}
        <span className='font-semibold text-[#16A34A]'>Free</span>
        {hasUniquePlus ? ' with Unique Plus or' : ' with Unique Plus'}
      </>
    );

    const handlePrimaryClick = () => {
      router.push(getHref(item));
    };
    const handleCoverClick = () => router.push(getHref(item));
    const handleSaveClick = () => void handleSaveBook(item);
    const primaryLabel = hasKeepForeverAccess ? 'Read Now' : isFreeItem ? 'Read Free' : hasUniquePlus ? `${displayPrice || ''} Keep Forever`.trim() : 'Read with Unique Plus';
    const primaryVariant = hasKeepForeverAccess ? 'free' : isFreeItem ? 'free' : hasUniquePlus ? 'keep-forever' : 'unique-plus';

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
    <div className='min-h-screen bg-gradient-to-r from-blue-100/80 via-indigo-100/70 to-purple-100/60'>
      <div className="mx-auto max-w-[1300px]">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        </div>

        <div className="px-4 pb-12 sm:px-6 lg:flex lg:gap-6 lg:px-8 xl:gap-8">
          <div
            className={`lg:flex-shrink-0 transition-all duration-300 ${
              isFilterSidebarCollapsed ? 'lg:w-12 xl:w-12' : 'lg:w-64 xl:w-62'
            }`}
          >
            {isFilterSidebarCollapsed && (
              <button
                onClick={() => setIsFilterSidebarCollapsed(false)}
                className='hidden h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700 lg:inline-flex'
                type='button'
                aria-label='Show filters'
                title='Show filters'
              >
                <ChevronRightIcon className='h-5 w-5' />
              </button>
            )}
            <BooksSidebar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              selectedFormats={[]}
              setSelectedFormats={() => {}}
              selectedTypes={[]}
              setSelectedTypes={() => {}}
              selectedLanguages={selectedLanguages}
              setSelectedLanguages={setSelectedLanguages}
              categories={categories}
              languages={languages}
              formats={[]}
              categoryCounts={categoryCounts}
              formatCounts={{}}
              languageCounts={languageCounts}
              typeCounts={{}}
              resultsCount={filteredItems.length}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              onDesktopCollapse={() => setIsFilterSidebarCollapsed(true)}
              searchPlaceholder={searchPlaceholder}
              className={isFilterSidebarCollapsed ? 'lg:hidden' : ''}
            />
          </div>

          <div className="flex-1 min-w-0 lg:pt-6">
            <div className={variant === 'landing' ? 'grid w-full grid-cols-[repeat(auto-fit,150px)] items-start justify-between gap-x-5 gap-y-10' : `grid ${variant === 'glass' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-6`}>
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
