'use client';

import type { ReactNode } from 'react';
import { BookmarkIcon as BookmarkIconOutline } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import CoverImageFrame from '@/components/ui/books/CoverImageFrame';

type LibraryCardVariant = 'book' | 'audiobook';
type LibraryCardButtonVariant = 'free' | 'unique-plus' | 'keep-forever';

interface BaseLibraryCardProps {
  image?: string | null;
  title: string;
  author: string;
  rating?: number | null;
  reviews?: number | null;
  priceLine?: ReactNode;
  primaryLabel: string;
  primaryVariant: LibraryCardButtonVariant;
  onPrimaryClick: () => void;
  onCoverClick?: () => void;
  isSaved: boolean;
  onSaveClick: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  coverVariant?: LibraryCardVariant;
  coverOverlay?: ReactNode;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  className?: string;
}

const primaryButtonClass = (variant: LibraryCardButtonVariant) => {
  if (variant === 'free') return 'bg-blue-600 text-white shadow-sm hover:bg-blue-700';
  if (variant === 'keep-forever') return 'bg-slate-950 text-white hover:bg-slate-800';
  return 'bg-gradient-to-r from-[#5146F7] to-[#7356FF] text-white shadow-[0_10px_25px_rgba(83,70,247,0.35)] hover:brightness-110';
};

export function LibraryCardDesktop({
  image,
  title,
  author,
  rating,
  reviews,
  priceLine,
  primaryLabel,
  primaryVariant,
  onPrimaryClick,
  onCoverClick,
  isSaved,
  onSaveClick,
  saveDisabled = false,
  saveLabel,
  coverVariant = 'book',
  coverOverlay,
  priority,
  loading,
  className = '',
}: BaseLibraryCardProps) {
  return (
    <div className={`group mx-auto flex h-auto w-[210px] flex-col overflow-visible rounded-lg bg-transparent transition-all duration-[250ms] ease-out hover:-translate-y-1.5 ${className}`}>
      <div
        className='relative h-[285px] w-[190px] overflow-hidden rounded-lg bg-transparent shadow-[0_12px_30px_rgba(0,0,0,0.10)] transition-shadow duration-[250ms] ease-out group-hover:shadow-[0_18px_36px_rgba(0,0,0,0.14)]'
        onClick={onCoverClick}
        role={onCoverClick ? 'button' : undefined}
        tabIndex={onCoverClick ? 0 : undefined}
        onKeyDown={(event) => {
          if (!onCoverClick) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onCoverClick();
          }
        }}
      >
        <CoverImageFrame
          src={image || undefined}
          alt={title}
          sizes='190px'
          priority={priority}
          loading={loading}
          className='h-[285px] w-[190px] rounded-lg border-0 bg-transparent shadow-none'
          imageClassName='transition-transform duration-[250ms] ease-out'
          fit='cover'
          showBackdrop={false}
          fixedAspectRatio={2 / 3}
          variant={coverVariant}
        >
          {coverOverlay}
        </CoverImageFrame>
      </div>

      <div className='flex flex-col pt-3 font-dm-sans'>
        <h3 className='truncate text-[16px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>{title}</h3>
        <p className='mt-1.5 truncate text-[13px] font-normal text-[#757575] font-dm-sans'>{author}</p>

        {(rating ?? 0) > 0 && (
          <div className='mt-2 flex items-center gap-2'>
            <StarIconSolid className='h-5 w-5 text-[#5146F7]' />
            <span className='text-[26px] font-bold leading-none text-[#1E1B4B] font-dm-sans'>{(rating || 0).toFixed(1)}</span>
            <span className='text-[14px] font-medium text-[#666666] font-dm-sans'>({reviews || 0})</span>
          </div>
        )}

        {priceLine ? (
          <p className='mt-2 truncate text-[13px] font-semibold text-[#1E1B4B] font-dm-sans'>
            {priceLine}
          </p>
        ) : null}

        <div className='mt-3 grid grid-cols-[minmax(0,1fr)_44px] gap-3'>
          <button
            type='button'
            onClick={onPrimaryClick}
            className={`flex h-10 w-full items-center justify-center rounded-[10px] text-[12px] font-semibold leading-none transition-all duration-[250ms] ease-out active:scale-95 font-dm-sans ${primaryButtonClass(primaryVariant)}`}
          >
            {primaryLabel}
          </button>
          <button
            type='button'
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSaveClick();
            }}
            disabled={saveDisabled}
            className={`flex h-10 w-10 items-center justify-center rounded-[10px] border shadow-sm transition-all duration-[250ms] ease-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans ${
              isSaved
                ? 'border-yellow-400 bg-yellow-400 text-white hover:bg-yellow-500'
                : 'border-[#E5E7EB] bg-white text-[#5146F7] hover:border-[#6D5CF6] hover:bg-violet-50'
            }`}
            aria-label={saveLabel || `Save ${title}`}
          >
            {isSaved ? <BookmarkIconSolid className='h-5 w-5' /> : <BookmarkIconOutline className='h-5 w-5' />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LibraryCardMobile({
  image,
  title,
  author,
  rating,
  reviews,
  priceLine,
  primaryLabel,
  primaryVariant,
  onPrimaryClick,
  onCoverClick,
  isSaved,
  onSaveClick,
  saveDisabled = false,
  saveLabel,
  coverVariant = 'book',
  coverOverlay,
  priority,
  loading,
  className = '',
}: BaseLibraryCardProps) {
  return (
    <div className={`group flex h-auto w-full flex-col overflow-visible rounded-lg bg-transparent transition-all duration-[250ms] ease-out ${className}`}>
      <div
        className='relative h-[170px] w-full overflow-hidden rounded-lg bg-transparent shadow-[0_10px_24px_rgba(0,0,0,0.10)]'
        onClick={onCoverClick}
        role={onCoverClick ? 'button' : undefined}
        tabIndex={onCoverClick ? 0 : undefined}
        onKeyDown={(event) => {
          if (!onCoverClick) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onCoverClick();
          }
        }}
      >
        <CoverImageFrame
          src={image || undefined}
          alt={title}
          sizes='(max-width: 768px) 50vw, 200px'
          priority={priority}
          loading={loading}
          className='h-[170px] w-full rounded-lg border-0 bg-transparent shadow-none'
          imageClassName='transition-transform duration-300'
          fit='cover'
          showBackdrop={false}
          fixedAspectRatio={2 / 3}
          variant={coverVariant}
        >
          {coverOverlay}
        </CoverImageFrame>
      </div>

      <div className='flex flex-col pt-2 font-dm-sans'>
        <h3 className='truncate text-[13px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>{title}</h3>
        <p className='mt-1 truncate text-[11px] font-normal text-[#757575] font-dm-sans'>{author}</p>

        {(rating ?? 0) > 0 && (
          <div className='mt-1.5 flex items-center gap-1.5'>
            <StarIconSolid className='h-4 w-4 text-[#5146F7]' />
            <span className='text-[20px] font-bold leading-none text-[#1E1B4B] font-dm-sans'>{(rating || 0).toFixed(1)}</span>
            <span className='text-[11px] font-medium text-[#666666] font-dm-sans'>({reviews || 0})</span>
          </div>
        )}

        {priceLine ? (
          <p className='mt-1.5 truncate text-[10px] font-semibold text-[#1E1B4B] font-dm-sans'>
            {priceLine}
          </p>
        ) : null}

        <div className='mt-2 grid grid-cols-[minmax(0,1fr)_34px] gap-2'>
          <button
            type='button'
            onClick={onPrimaryClick}
            className={`flex h-9 w-full items-center justify-center rounded-[10px] text-[10px] font-semibold leading-none transition-all active:scale-95 font-dm-sans ${primaryButtonClass(primaryVariant)}`}
          >
            {primaryLabel}
          </button>
          <button
            type='button'
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSaveClick();
            }}
            disabled={saveDisabled}
            className={`flex h-9 w-9 items-center justify-center rounded-[10px] border shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans ${
              isSaved
                ? 'border-yellow-400 bg-yellow-400 text-white'
                : 'border-slate-200 bg-white text-blue-600'
            }`}
            aria-label={saveLabel || `Save ${title}`}
          >
            {isSaved ? <BookmarkIconSolid className='h-4 w-4' /> : <BookmarkIconOutline className='h-4 w-4' />}
          </button>
        </div>
      </div>
    </div>
  );
}
