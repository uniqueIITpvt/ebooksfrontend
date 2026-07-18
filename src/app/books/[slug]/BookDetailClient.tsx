'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeftIcon,
  StarIcon,
  ClockIcon,
  BookOpenIcon,
  SpeakerWaveIcon,
  ShareIcon,
  HeartIcon,
  ShoppingCartIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as SolidStarIcon,
  HeartIcon as SolidHeartIcon,
} from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { authApi } from '@/services/api/authApi';
import { booksApi, type Book } from '@/services/api/booksApi';
import type { PublicBookListItem } from '@/types/publicBook';
import { generateBookSlug } from '@/utils/slugify';

interface BookDetailClientProps {
  book: Book;
  relatedBooks: PublicBookListItem[];
}

export default function BookDetailClient({
  book,
  relatedBooks,
}: BookDetailClientProps) {
  const router = useRouter();
  const { user, setIsLoginModalOpen, refreshUser, openAuthModal } = useAuth();
  const { addToCart, isInCart } = useCart();
  const [selectedFormat, setSelectedFormat] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentBook, setCurrentBook] = useState(book);
  const [userRating, setUserRating] = useState<number>(0);
  const [cartFeedback, setCartFeedback] = useState<'added' | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<string>('');

  const parseCurrency = (value?: string | number | null) =>
    Number.parseFloat(String(value || '0').replace(/[^0-9.]/g, '')) || 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);

  useEffect(() => {
    // Check if format is specified in URL parameters (from landing page selection)
    const urlParams = new URLSearchParams(window.location.search);
    const formatFromUrl = urlParams.get('format');
    
    if (formatFromUrl && ['Hardcover', 'Paperback', 'E-book'].includes(formatFromUrl)) {
      setSelectedFormat(formatFromUrl);
    } else {
      // Always set default format to Hardcover
      setSelectedFormat('Hardcover');
    }
  }, [currentBook]);

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
    // Update price when format or quantity changes
    const updatePrice = () => {
      const basePrice = parseCurrency(currentBook.price);
      let formatPrice = basePrice;
      
      // If API provides format-specific pricing, use it
      if (currentBook.formatPrices && currentBook.formatPrices[selectedFormat]) {
        formatPrice = parseCurrency(currentBook.formatPrices[selectedFormat]);
      } else {
        // Fallback to hardcoded format-specific pricing
        switch (selectedFormat) {
          case 'Hardcover':
            formatPrice = basePrice * 1.5; // 50% more expensive
            break;
          case 'Paperback':
            formatPrice = basePrice * 1.0; // Base price
            break;
          case 'E-book':
            formatPrice = basePrice * 0.7; // 30% cheaper
            break;
          default:
            formatPrice = basePrice;
        }
      }
      
      const finalPrice = formatPrice * quantity;
      setCurrentPrice(formatCurrency(finalPrice));
    };
    
    updatePrice();
  }, [selectedFormat, quantity, currentBook]);

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

  const handleAddToCart = () => {
    const price = parseFloat((currentPrice || calculateTotalPrice()).replace(/[^0-9.]/g, '')) / quantity;
    const originalPrice = currentBook.originalPrice
      ? parseFloat(String(currentBook.originalPrice).replace(/[^0-9.]/g, ''))
      : undefined;

    addToCart({
      id: currentBook.id || (currentBook as any)._id,
      title: currentBook.title,
      author: currentBook.author || 'UniqueIIT Research Center',
      price,
      originalPrice,
      image: currentBook.image || '',
      slug: currentBook.slug || currentBook.id,
      category: currentBook.category || '',
      format: selectedFormat,
      language: currentBook.language,
    }, quantity);

    setCartFeedback('added');
    setTimeout(() => setCartFeedback(null), 3000);
  };

  const handleBuyNow = () => {
    const params = new URLSearchParams({
      id: currentBook.id || (currentBook as any)._id,
      qty: String(quantity),
    });

    if (selectedFormat) {
      params.set('format', selectedFormat);
    }

    router.push(`/checkout?${params.toString()}`);
  };

  const isFreeBook =
    currentBook.componentType === 'free-summaries' ||
    currentBook.accessLevel === 'free' ||
    parseCurrency(currentBook.price) <= 0;

  const handlePrimaryAccess = async () => {
    if (!isFreeBook) {
      handleBuyNow();
      return;
    }

    if (!user) {
      openAuthModal('signin', window.location.pathname);
      return;
    }

    setClaiming(true);
    try {
      const response = await booksApi.claim(currentBook.slug || currentBook.id);
      router.push(response.data?.redirectTarget || `/books/${currentBook.slug || currentBook.id}/read`);
    } catch (error: any) {
      alert(error?.message || 'Unable to claim this book');
    } finally {
      setClaiming(false);
    }
  };

  const handleSubscribeClick = () => {
    if (!user) {
      setIsLoginModalOpen(true);
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
      router.push(`/user/auth?returnUrl=${encodeURIComponent(window.location.pathname)}`);
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

  const calculateTotalPrice = () => {
    const parsedBasePrice = parseCurrency(currentBook.price);
    const parsedFormatPrice =
      currentBook.formatPrices && currentBook.formatPrices[selectedFormat]
        ? parseCurrency(currentBook.formatPrices[selectedFormat])
        : parsedBasePrice;

    return formatCurrency(parsedFormatPrice * quantity);

  };

  const freeActionButtons = (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={handlePrimaryAccess}
        disabled={claiming}
        className="min-w-[150px] px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-[13px] hover:bg-green-700 transition-all font-syne flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <BookOpenIcon className="w-5 h-5" />
        {claiming ? 'Claiming...' : 'Read Free'}
      </button>
    </div>
  );

  const currentBookCartId = currentBook.id || (currentBook as any)._id;
  const isCurrentBookInCart =
    isInCart(currentBookCartId, selectedFormat) || isInCart(currentBookCartId);

  const actionButtons = isFreeBook ? freeActionButtons : (
    <div className="flex items-center justify-end gap-2">
      {isCurrentBookInCart ? (
        <Link
          href="/cart"
          className="min-w-[130px] px-4 py-2.5 border-2 border-green-600 bg-green-600 text-white rounded-xl font-bold text-[13px] hover:bg-green-700 transition-all font-syne flex items-center justify-center gap-2"
        >
          <ShoppingCartIcon className="w-5 h-5" />
          In Cart
        </Link>
      ) : (
        <button
          onClick={handleAddToCart}
          className="min-w-[130px] px-4 py-2.5 border-2 border-slate-900 text-slate-900 rounded-xl font-bold text-[13px] hover:bg-slate-50 transition-all font-syne flex items-center justify-center gap-2"
        >
          <ShoppingCartIcon className="w-5 h-5" />
          Add to Cart
        </button>
      )}
      <button
        onClick={handleBuyNow}
        className="min-w-[120px] px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all font-syne flex items-center justify-center gap-2"
      >
        Buy Now
      </button>
      <button
        onClick={handleSubscribeClick}
        className="min-w-[120px] px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-[13px] hover:bg-indigo-700 transition-all font-syne flex items-center justify-center gap-2"
      >
        Subscribe
      </button>
    </div>
  );

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
            <div className="flex flex-row flex-wrap items-center justify-between gap-2">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {currentBook.category}
              </span>
              {actionButtons}
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

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 group">
                {[...Array(5)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleRatingClick(index + 1)}
                    className="transition-transform active:scale-90"
                  >
                    {index < (userRating || Math.floor(currentBook.rating)) ? (
                      <SolidStarIcon className="w-6 h-6 text-yellow-500" />
                    ) : (
                      <StarIcon className="w-6 h-6 text-gray-300 hover:text-yellow-200 transition-colors" />
                    )}
                  </button>
                ))}
              </div>
              <span className="font-syne font-bold text-gray-900 text-lg">{userRating || currentBook.rating}</span>
              <span className="text-gray-400 font-medium font-dm-sans">
                ({currentBook.reviews + (userRating ? 1 : 0)} reviews)
              </span>
            </div>

            <div className="flex items-baseline gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              {isFreeBook ? (
                <>
                  <span className="text-3xl font-bold text-gray-400 line-through font-syne">
                    {currentPrice || calculateTotalPrice()}
                  </span>
                  <span className="text-3xl font-extrabold text-green-600 font-syne">
                    Free
                  </span>
                </>
              ) : (
                <span className="text-4xl font-bold text-slate-900 font-syne">{currentPrice || calculateTotalPrice()}</span>
              )}
              {!isFreeBook && currentBook.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  {(() => {
                    // Check if API provides format-specific original pricing
                    if (currentBook.formatOriginalPrices && currentBook.formatOriginalPrices[selectedFormat]) {
                      const formatOriginalPrice = parseFloat(currentBook.formatOriginalPrices[selectedFormat].replace(/^[₹$]/, ''));
                      return `₹${formatOriginalPrice.toFixed(2)}`;
                    } else {
                      // Fallback to hardcoded format-specific original pricing
                      const baseOriginalPrice = parseFloat(currentBook.originalPrice.replace(/^[₹$]/, ''));
                      let formatOriginalPrice = baseOriginalPrice;
                      switch (selectedFormat) {
                        case 'Hardcover':
                          formatOriginalPrice = baseOriginalPrice * 1.5;
                          break;
                        case 'Paperback':
                          formatOriginalPrice = baseOriginalPrice * 1.0;
                          break;
                        case 'E-book':
                          formatOriginalPrice = baseOriginalPrice * 0.7;
                          break;
                        default:
                          formatOriginalPrice = baseOriginalPrice;
                      }
                      return `₹${formatOriginalPrice.toFixed(2)}`;
                    }
                  })()}
                </span>
              )}
            </div>

            {!isFreeBook && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Hardcover', 'Paperback', 'E-book'].map((format) => (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedFormat === format
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isFreeBook && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold"
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {actionButtons}
              {cartFeedback === 'added' && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                  <span className="text-emerald-700 font-semibold text-sm">✓ Added to cart!</span>
                  <Link href="/cart" className="text-sm font-bold text-blue-600 hover:underline">
                    View Cart →
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-6 border-t">
              {currentBook.pages && (
                <div className="flex items-center gap-3">
                  <BookOpenIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Pages</div>
                    <div className="font-semibold">{currentBook.pages}</div>
                  </div>
                </div>
              )}
              {currentBook.duration && (
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-semibold">{currentBook.duration}</div>
                  </div>
                </div>
              )}
              {currentBook.type && (
                <div className="flex items-center gap-3">
                  {currentBook.type === 'Audiobook' ? (
                    <SpeakerWaveIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <BookOpenIcon className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <div className="text-sm text-gray-500">Type</div>
                    <div className="font-semibold">{currentBook.type}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <CheckIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Published</div>
                  <div className="font-semibold">
                    {new Date(currentBook.publishDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </div>
                </div>
              </div>
            </div>
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
