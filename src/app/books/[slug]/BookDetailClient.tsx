'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeftIcon,
  StarIcon,
  BookOpenIcon,
  SpeakerWaveIcon,
  ShareIcon,
  HeartIcon,
  CheckIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as SolidStarIcon,
  HeartIcon as SolidHeartIcon,
} from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api/authApi';
import { booksApi, type Book } from '@/services/api/booksApi';
import { libraryApi } from '@/services/api/libraryApi';
import type { PublicBookListItem } from '@/types/publicBook';
import { generateBookSlug } from '@/utils/slugify';
import { AccessChoicePanel } from '@/components/ui/details/AccessChoicePanel';
import { getActiveSubscriptionPlan, hasActiveSubscription } from '@/lib/subscription';
import { LibraryCardDesktop } from '@/components/ui/cards/LibraryCard';

interface BookDetailClientProps {
  book: Book;
  relatedBooks: PublicBookListItem[];
}

export default function BookDetailClient({
  book,
  relatedBooks,
}: BookDetailClientProps) {
  const router = useRouter();
  const { user, refreshUser, openAuthModal } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [currentBook, setCurrentBook] = useState(book);
  const [userRating, setUserRating] = useState<number>(0);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [savingRelatedId, setSavingRelatedId] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [libraryPurchasedAccess, setLibraryPurchasedAccess] = useState(false);
  const [libraryAccessChecked, setLibraryAccessChecked] = useState(false);
  const [relatedSavedOverrides, setRelatedSavedOverrides] = useState<Record<string, boolean>>({});

  const parseCurrency = (value?: string | number | null) =>
    Number.parseFloat(String(value || '0').replace(/[^0-9.]/g, '')) || 0;

  const currentBookId = String(currentBook.id || (currentBook as any)._id || '');
  const currentBookSlug = currentBook.slug || generateBookSlug(currentBook.title || '');
  const currentBookDetailPath = `/books/${currentBookSlug}`;
  const currentBookReadPath = `${currentBookDetailPath}/read`;
  const hasUniquePlusAccess = hasActiveSubscription(user);
  const activeSubscriptionPlan = getActiveSubscriptionPlan(user);
  const isReadFreeSummary =
    currentBook.componentType === 'free-summaries' && parseCurrency(currentBook.price) <= 0;

  const normalizeBookReference = (entry: any) => {
    if (!entry) return [];
    if (typeof entry === 'string' || typeof entry === 'number') return [{ id: String(entry) }];

    return [
      entry,
      entry.bookId,
      entry.book,
      entry.item,
      entry.product,
    ].filter(Boolean);
  };

  const matchesCurrentBook = (entry: any) =>
    normalizeBookReference(entry).some((bookRef) => {
      const refId = String(bookRef?._id || bookRef?.id || bookRef?.bookId || '');
      const refSlug = bookRef?.slug || (bookRef?.title ? generateBookSlug(bookRef.title) : '');

      return (
        (currentBookId && refId === currentBookId) ||
        (currentBookSlug && refSlug === currentBookSlug)
      );
    });

  const purchasedCollections = [
    (user as any)?.purchasedBooks,
    (user as any)?.ownedBooks,
    (user as any)?.purchases,
  ];

  const hasLocalKeepForeverAccess = purchasedCollections.some(
    (collection) => Array.isArray(collection) && collection.some(matchesCurrentBook),
  );
  const hasKeepForeverAccess = hasLocalKeepForeverAccess || libraryPurchasedAccess;
  const canReadCurrentBook = hasKeepForeverAccess || hasUniquePlusAccess;
  const canDownloadCurrentBook = hasKeepForeverAccess;
  const ebookDownloadUrl = currentBook.files?.ebook?.url || '';

  const sanitizeFileName = (value: string) =>
    value.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'ebook';

  const getEbookFileName = () => {
    const originalName = currentBook.files?.ebook?.originalName;
    if (originalName) return sanitizeFileName(originalName);

    const mimeType = currentBook.files?.ebook?.mimeType || '';
    const extension =
      mimeType === 'application/pdf'
        ? 'pdf'
        : mimeType === 'application/epub+zip'
          ? 'epub'
          : mimeType === 'text/plain'
            ? 'txt'
            : 'pdf';

    return `${sanitizeFileName(currentBook.title)}.${extension}`;
  };

  const getCheckoutPath = () => {
    const params = new URLSearchParams({
      id: String(currentBook.id || (currentBook as any)._id || currentBook.slug || ''),
      qty: '1',
      format: 'E-book',
    });

    return `/checkout?${params.toString()}`;
  };

  useEffect(() => {
    const currentBookId = String(currentBook.id || (currentBook as any)._id || '');
    const currentBookSlug = currentBook.slug || '';
    const saved = user?.savedBooks?.some((item) => {
      const rawBookId = item.bookId;
      const savedBookId =
        typeof rawBookId === 'object'
          ? rawBookId?._id || rawBookId?.id
          : rawBookId || item.id || item._id;
      const savedBookSlug =
        typeof rawBookId === 'object' ? rawBookId?.slug : item.slug;

      return (
        (currentBookId && String(savedBookId) === currentBookId) ||
        (currentBookSlug && savedBookSlug === currentBookSlug)
      );
    });
    setIsFavorited(Boolean(saved));
  }, [currentBook, user]);

  useEffect(() => {
    if (!user) {
      setLibraryPurchasedAccess(false);
      setLibraryAccessChecked(true);
      return;
    }

    let ignore = false;
    setLibraryAccessChecked(false);

    libraryApi
      .getMyLibrary()
      .then((response) => {
        if (ignore) return;

        const isPurchasedInLibrary = (response.data || []).some((item) => {
          const itemId = String(item.itemId || item.id || '');
          const itemSlug = item.slug || (item.title ? generateBookSlug(item.title) : '');

          return (
            item.itemType === 'ebook' &&
            item.accessMode === 'purchase' &&
            item.status === 'active' &&
            ((currentBookId && itemId === currentBookId) ||
              (currentBookSlug && itemSlug === currentBookSlug))
          );
        });

        setLibraryPurchasedAccess(isPurchasedInLibrary);
      })
      .catch(() => {
        if (!ignore) setLibraryPurchasedAccess(false);
      })
      .finally(() => {
        if (!ignore) setLibraryAccessChecked(true);
      });

    return () => {
      ignore = true;
    };
  }, [currentBookId, currentBookSlug, user]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentBook.title,
          text: currentBook.subtitle,
          url: window.location.href,
        });
      } catch { }
      return;
    }

    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleBuyNow = () => {
    if (!user) {
      openAuthModal('signin', getCheckoutPath());
      return;
    }

    if (hasKeepForeverAccess) {
      router.push(currentBookReadPath);
      return;
    }

    router.push(getCheckoutPath());
  };

  const handleSubscribeClick = () => {
    const subscriptionPath = `/subscription?returnTo=${encodeURIComponent(currentBookDetailPath)}`;

    if (!user) {
      openAuthModal('signin', subscriptionPath);
      return;
    }

    if (hasUniquePlusAccess) {
      router.push(currentBookReadPath);
      return;
    }

    router.push(subscriptionPath);
  };

  const handleDownloadZip = async () => {
    if (!ebookDownloadUrl) return;

    setDownloadingZip(true);
    try {
      const JSZip = (await import('jszip')).default;
      const response = await fetch(ebookDownloadUrl);
      if (!response.ok) throw new Error('Unable to download ebook file');

      const ebookBlob = await response.blob();
      const zip = new JSZip();
      zip.file(getEbookFileName(), ebookBlob);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${sanitizeFileName(currentBook.title)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      alert(error?.message || 'Unable to download ZIP file.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleRatingClick = async (newRating: number) => {
    setUserRating(newRating);

    try {
      const response = await booksApi.updateRating(currentBook.id, newRating);
      if (response.success) {
        setCurrentBook(response.data);
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const formatCardPrice = (price?: string | null) => {
    if (!price) return null;
    return `₹${price.replace(/^[^0-9.]*/, '').replace(/\.00$/, '')}`;
  };

  const getRelatedHref = (relatedBook: PublicBookListItem) =>
    `/books/${relatedBook.slug || generateBookSlug(relatedBook.title)}`;

  const getRelatedId = (relatedBook: PublicBookListItem) =>
    relatedBook._id || relatedBook.id || relatedBook.slug || relatedBook.title;

  const isRelatedSaved = (relatedBook: PublicBookListItem) => {
    const relatedId = getRelatedId(relatedBook);
    const override = relatedSavedOverrides[relatedId];
    if (override !== undefined) return override;

    const relatedKeys = [
      relatedBook.slug,
      relatedBook.id,
      relatedBook._id,
      relatedBook.title,
      generateBookSlug(relatedBook.title),
    ].filter(Boolean).map(String);

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

      return relatedKeys.some((key) => savedKeys.includes(key));
    });
  };

  const handleSaveRelatedBook = async (relatedBook: PublicBookListItem) => {
    const identifier = relatedBook.slug || relatedBook.id || relatedBook._id;
    if (!identifier) return;

    const href = getRelatedHref(relatedBook);
    if (!user) {
      openAuthModal('signin', href);
      return;
    }

    const relatedId = getRelatedId(relatedBook);
    setSavingRelatedId(relatedId);
    try {
      const response = await authApi.toggleSavedBook(identifier);
      if (response.success) {
        setRelatedSavedOverrides((current) => ({
          ...current,
          [relatedId]: response.data?.saved ?? !isRelatedSaved(relatedBook),
        }));
      }
      await refreshUser();
    } catch (error: any) {
      alert(error?.message || 'Unable to save this item');
    } finally {
      setSavingRelatedId(null);
    }
  };

  const handleToggleFavorite = async () => {
    const identifier = currentBook.id || (currentBook as any)._id || currentBook.slug;

    if (!identifier) return;

    if (!user) {
      openAuthModal('signin', window.location.pathname);
      return;
    }

    setSavingFavorite(true);
    try {
      const response = await authApi.toggleSavedBook(identifier);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Unable to update saved book');
      }

      setIsFavorited(response.data.saved);
      await refreshUser();
    } catch (error: any) {
      alert(error?.message || 'Unable to update saved book');
    } finally {
      setSavingFavorite(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 mt-[2px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="mb-4">
          <button
            onClick={() => router.push('/books')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-lg shadow-sm"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back to Books</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-15 lg:gap-20 items-start">
          <div className="flex flex-col gap-3 flex-shrink-0">
            <div className="relative aspect-[3/4] w-[280px] lg:w-[320px] rounded-2xl overflow-hidden bg-white shadow-xl border border-gray-100">
              {currentBook.image ? (
                <Image
                  src={currentBook.image}
                  alt={currentBook.title}
                  fill
                  className="object-contain object-center"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
              {currentBook.bestseller && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Bestseller
                </div>
              )}
              {currentBook.featured && (
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Featured
                </div>
              )}
            </div>

            <div className="flex gap-3 w-[280px] lg:w-[320px]">
              <button
                onClick={handleToggleFavorite}
                disabled={savingFavorite}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${isFavorited
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isFavorited ? (
                  <SolidHeartIcon className="w-5 h-5 fill-white text-white" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {savingFavorite ? 'Saving...' : isFavorited ? 'Saved' : 'Save'}
                </span>
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ShareIcon className="w-5 h-5" />
                <span className="font-medium">Share</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-row flex-wrap items-center gap-2">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {currentBook.category}
              </span>
            </div>

            <div>
              <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-2">
                {currentBook.title}
              </h1>
              <p className="text-lg text-gray-600">{currentBook.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600">by</span>
              <span className="font-semibold text-gray-900">{currentBook.author}</span>
            </div>

            <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-gray-100 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center gap-1 group">
                {[...Array(5)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleRatingClick(index + 1)}
                    className="transition-transform active:scale-90"
                    aria-label={`Rate ${index + 1} star`}
                  >
                    {index < (userRating || Math.floor(currentBook.rating)) ? (
                      <SolidStarIcon className="w-6 h-6 text-blue-600" />
                    ) : (
                      <StarIcon className="w-6 h-6 text-blue-100 hover:text-blue-300 transition-colors" />
                    )}
                  </button>
                ))}
              </div>
              <span className="font-syne font-bold text-gray-900 text-lg">{userRating || currentBook.rating}</span>
              <span className="text-gray-400 font-medium font-dm-sans">
                ({currentBook.reviews + (userRating ? 1 : 0)} reviews)
              </span>
              {currentBook.pages && (
                <div className="flex items-center gap-3">
                  <BookOpenIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Pages</div>
                    <div className="font-semibold">{currentBook.pages}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                {currentBook.type === 'Audiobook' ? (
                  <SpeakerWaveIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <BookOpenIcon className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <div className="text-sm text-gray-500">Type</div>
                  <div className="font-semibold">{currentBook.type || 'Books'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Published</div>
                  <div className="font-semibold">
                    {currentBook.publishDate
                      ? new Date(currentBook.publishDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                      })
                      : 'N/A'}
                  </div>
                </div>
              </div>
              {canDownloadCurrentBook && (
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={!ebookDownloadUrl || downloadingZip}
                  className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  {downloadingZip ? 'Preparing ZIP...' : 'ZIP Download'}
                </button>
              )}
            </div>
            {canReadCurrentBook && (
              <button
                type="button"
                onClick={() => router.push(currentBookReadPath)}
                className="w-full md:wml-auto inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Read Now
              </button>
            )}
            {!isReadFreeSummary && libraryAccessChecked && !hasKeepForeverAccess && (
              <AccessChoicePanel
                itemLabel="book"
                price={currentBook.price}
                onStartUniquePlus={handleSubscribeClick}
                onKeepForever={handleBuyNow}
                uniquePlusButtonLabel={hasUniquePlusAccess ? 'Read with Unique Plus' : 'Start Unique Plus'}
                keepForeverButtonLabel={hasKeepForeverAccess ? 'Read Now' : undefined}
                activePlan={activeSubscriptionPlan}
              />
            )}

          </div>
        </div>

        <div className="mt-12 lg:mt-16">
          <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Book</h2>
            <div className={`text-gray-600 leading-relaxed ${!showFullDescription ? 'line-clamp-4' : ''}`}>
              {currentBook.description}
            </div>
            {currentBook.description.length > 200 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-4 text-blue-600 font-semibold hover:text-blue-700"
              >
                {showFullDescription ? 'Show Less' : 'Read More'}
              </button>
            )}

            <div className="mt-8 pt-8 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">ISBN</h3>
                <p className="text-gray-600">{currentBook.isbn}</p>
              </div>
              {currentBook.narrator && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Narrator</h3>
                  <p className="text-gray-600">{currentBook.narrator}</p>
                </div>
              )}
            </div>

            {currentBook.tags && currentBook.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {currentBook.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {relatedBooks.length > 0 && (
          <div className="mt-12 lg:mt-16">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
              You May Also Like
            </h2>
            <div className="grid w-full grid-cols-[repeat(5,150px)] items-start gap-x-8 gap-y-10">
              {relatedBooks.slice(0, 5).map((relatedBook, index) => {
                const href = getRelatedHref(relatedBook);
                const isFreeItem = parseCurrency(relatedBook.price) <= 0;
                const displayPrice = formatCardPrice(relatedBook.price);

                return (
                  <div
                    key={relatedBook.id || relatedBook.slug || relatedBook.title}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(href)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(href);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <LibraryCardDesktop
                      image={relatedBook.image}
                      title={relatedBook.title}
                      author={relatedBook.author}
                      rating={relatedBook.rating}
                      reviews={relatedBook.reviews}
                      priceLine={
                        isFreeItem ? null : (
                          <>
                            {hasUniquePlusAccess ? 'Read ' : <>{displayPrice ? `${displayPrice} or ` : ''}</>}
                            <span className="font-semibold text-[#16A34A]">Free</span>
                            {hasUniquePlusAccess ? ' with Unique Plus or' : ' with Unique Plus'}
                          </>
                        )
                      }
                      primaryLabel={isFreeItem ? 'Read Free' : hasUniquePlusAccess ? `${displayPrice || ''} Keep Forever`.trim() : 'Read with Unique Plus'}
                      primaryVariant={isFreeItem ? 'free' : hasUniquePlusAccess ? 'keep-forever' : 'unique-plus'}
                      onPrimaryClick={() => router.push(href)}
                      onCoverClick={() => router.push(href)}
                      isSaved={isRelatedSaved(relatedBook)}
                      onSaveClick={() => void handleSaveRelatedBook(relatedBook)}
                      saveDisabled={savingRelatedId === getRelatedId(relatedBook)}
                      saveLabel={`Save ${relatedBook.title}`}
                      coverVariant={relatedBook.type === 'Audiobook' ? 'audiobook' : 'book'}
                      priority={index < 3}
                      loading={index < 3 ? 'eager' : 'lazy'}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
