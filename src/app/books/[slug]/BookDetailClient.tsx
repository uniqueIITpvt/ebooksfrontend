'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeftIcon,
  StarIcon,
  BookOpenIcon,
  SpeakerWaveIcon,
  ShareIcon,
  HeartIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as SolidStarIcon,
  HeartIcon as SolidHeartIcon,
} from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api/authApi';
import { booksApi, type Book } from '@/services/api/booksApi';
import type { PublicBookListItem } from '@/types/publicBook';
import { generateBookSlug } from '@/utils/slugify';
import { AccessChoicePanel } from '@/components/ui/details/AccessChoicePanel';

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

  const parseCurrency = (value?: string | number | null) =>
    Number.parseFloat(String(value || '0').replace(/[^0-9.]/g, '')) || 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentBook.title,
          text: currentBook.subtitle,
          url: window.location.href,
        });
      } catch {}
      return;
    }

    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleBuyNow = () => {
    const params = new URLSearchParams({
      id: String(currentBook.id || (currentBook as any)._id || currentBook.slug || ''),
      qty: '1',
      format: 'E-book',
    });

    router.push(`/checkout?${params.toString()}`);
  };

  const handleSubscribeClick = () => {
    if (!user) {
      openAuthModal('signin', '/subscription');
      return;
    }

    router.push('/subscription');
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

  const formatPrice = (price?: string | null) => {
    if (!price) return '';
    return formatCurrency(parseCurrency(price));
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
            onClick={() => router.back()}
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
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                  isFavorited
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
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
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
            </div>

            <AccessChoicePanel
              itemLabel="book"
              price={currentBook.price}
              onStartUniquePlus={handleSubscribeClick}
              onKeepForever={handleBuyNow}
            />

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedBooks.map((relatedBook) => (
                <Link
                  key={relatedBook.id}
                  href={`/books/${relatedBook.slug || generateBookSlug(relatedBook.title)}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative aspect-[4/5] bg-gray-50">
                      {relatedBook.image ? (
                        <Image
                          src={relatedBook.image}
                          alt={relatedBook.title}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400 text-sm">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                        {relatedBook.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <SolidStarIcon className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-medium">{relatedBook.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">({relatedBook.reviews})</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-gray-900">{formatPrice(relatedBook.price)}</span>
                        {relatedBook.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(relatedBook.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
