'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/Button';
import { useAuth } from '@/contexts/AuthContext';
import { freeSummariesApi } from '@/services/api/freeSummariesApi';
import {
  BookOpenIcon,
  CheckIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';

interface DetailRow {
  label: string;
  value: string;
}

interface DetailMeta {
  rating?: number;
  reviews?: number;
  pages?: number | string;
  readingTime?: string;
  type?: string;
  publishDate?: string;
}

interface SimpleLibraryDetailProps {
  backHref: string;
  backLabel: string;
  category: string;
  title: string;
  author: string;
  description: string;
  image?: string;
  featured?: boolean;
  badge?: string;
  actionLabel: string;
  actionHref?: string;
  actionRequiresAuth?: boolean;
  detailRows?: DetailRow[];
  meta?: DetailMeta;
  ratingId?: string;
  compactMedia?: boolean;
}

export default function SimpleLibraryDetail({
  backHref,
  backLabel,
  category,
  title,
  author,
  description,
  image,
  featured,
  badge,
  actionLabel,
  actionHref,
  actionRequiresAuth = false,
  detailRows = [],
  meta,
  ratingId,
  compactMedia = false,
}: SimpleLibraryDetailProps) {
  const router = useRouter();
  const { openAuthModal, user } = useAuth();
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [displayRating, setDisplayRating] = useState(meta?.rating ?? 0);
  const [displayReviews, setDisplayReviews] = useState(meta?.reviews ?? 0);

  const handleActionClick = () => {
    if (!actionHref) return;

    if (actionRequiresAuth && !user) {
      openAuthModal('signin', actionHref);
      return;
    }

    router.push(actionHref);
  };

  const publishDateLabel = meta?.publishDate
    ? new Date(meta.publishDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
    : 'N/A';
  const handleRatingClick = async (stars: number) => {
    if (!ratingId) return;

    const nextReviews = userRating ? displayReviews : displayReviews + 1;
    const nextRating = userRating
      ? stars
      : Math.round(((displayRating * displayReviews) + stars) / nextReviews * 10) / 10;

    setUserRating(stars);
    setDisplayRating(nextRating);
    setDisplayReviews(nextReviews);

    try {
      const result = await freeSummariesApi.rate(ratingId, stars);
      setDisplayRating(result.rating);
      setDisplayReviews(result.reviews);
    } catch {
      // Keep optimistic rating visible if the request fails.
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">{backLabel}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className={`grid grid-cols-1 gap-8 ${compactMedia ? 'lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10' : 'lg:grid-cols-2 lg:gap-12'}`}>
          <div className="space-y-6">
            <div className={`relative aspect-[2/3] overflow-hidden rounded-2xl bg-white shadow-xl ${compactMedia ? 'mx-auto w-full max-w-[260px]' : 'aspect-[3/4]'}`}>
              {image ? (
                <Image
                  src={image}
                  alt={title}
                  fill
                  className={compactMedia ? 'object-contain object-center' : 'object-cover object-center'}
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
              {featured && (
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Featured
                </div>
              )}
              {badge && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {badge}
                </div>
              )}
            </div>
          </div>

          <div className={compactMedia ? 'space-y-5' : 'space-y-6'}>
            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {category}
              </span>
            </div>

            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
            </div>

            <div className={compactMedia ? 'flex flex-wrap items-center gap-x-8 gap-y-3' : 'flex items-center gap-2'}>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">by</span>
                <span className="font-semibold text-gray-900">{author}</span>
              </div>
              {compactMedia && detailRows.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {detailRows.map((row) => (
                    <div key={row.label}>
                      <div className="text-sm text-gray-500">{row.label}</div>
                      <div className="font-semibold text-gray-900">{row.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {meta && (
              <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-gray-100 bg-white/70 p-4 shadow-sm">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => void handleRatingClick(index + 1)}
                      onMouseEnter={() => setHoverRating(index + 1)}
                      onMouseLeave={() => setHoverRating(0)}
                      disabled={!ratingId}
                      aria-label={`Rate ${index + 1} star${index === 0 ? '' : 's'}`}
                      className="transition-transform active:scale-90 disabled:cursor-default"
                    >
                      {index < (hoverRating || userRating || Math.floor(displayRating)) ? (
                        <SolidStarIcon className="w-6 h-6 text-blue-600" />
                      ) : (
                        <StarIcon className="w-6 h-6 text-blue-100 hover:text-blue-300 transition-colors" />
                      )}
                    </button>
                  ))}
                </div>
                <span className="font-syne font-bold text-gray-900 text-lg">{displayRating}</span>
                <span className="text-gray-400 font-medium font-dm-sans">
                  ({displayReviews} reviews)
                </span>
                {meta.pages && (
                  <div className="flex items-center gap-3">
                    <BookOpenIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Pages</div>
                      <div className="font-semibold">{meta.pages}</div>
                    </div>
                  </div>
                )}
                {meta.readingTime && (
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Reading Time</div>
                      <div className="font-semibold">{meta.readingTime}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <BookOpenIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Type</div>
                    <div className="font-semibold">{meta.type || 'Free Summary'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Published</div>
                    <div className="font-semibold">{publishDateLabel}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About This Item</h2>
              <p className="text-gray-600 leading-relaxed">
                {description}
              </p>
            </div>

            {!compactMedia && detailRows.length > 0 && (
              <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div>
                      <div className="text-sm text-gray-500">{row.label}</div>
                      <div className="font-semibold">{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {actionHref ? (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className={`inline-flex h-10 items-center justify-center rounded-[10px] bg-gradient-to-r from-blue-500 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl ${
                    compactMedia ? 'w-auto min-w-[180px]' : 'w-full'
                  }`}
                >
                  {actionLabel}
                </button>
              ) : (
                <Button variant="primary" fullWidth>
                  {actionLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
