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
    <div className={`group flex h-auto w-[170px] flex-col overflow-visible rounded-lg bg-transparent transition-all duration-[250ms] ease-out hover:-translate-y-1.5 ${className}`}>
      <div
        className='relative h-[245px] w-[170px] overflow-hidden rounded-lg bg-transparent p-1.5 transition-shadow duration-[250ms] ease-out'
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
          sizes='170px'
          priority={priority}
          loading={loading}
          className='h-full w-full rounded-md border-0 bg-transparent shadow-none'
          imageClassName='transition-transform duration-[250ms] ease-out'
          fit='contain'
          showBackdrop={false}
          fixedAspectRatio={2 / 3}
          variant={coverVariant}
        >
          {coverOverlay}
        </CoverImageFrame>
      </div>

      <div className='flex flex-col pt-2.5 font-dm-sans'>
        <h3 className='truncate text-[14px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>{title}</h3>
        <p className='mt-1 truncate text-[12px] font-normal text-[#757575] font-dm-sans'>{author}</p>

        {(rating ?? 0) > 0 && (
          <div className='mt-1.5 flex items-center gap-1.5'>
            <StarIconSolid className='h-4 w-4 text-[#5146F7]' />
            <span className='font-semibold leading-none text-[#1E1B4B] font-dm-sans'>{(rating || 0).toFixed(1)}</span>
            <span className='text-[12px] font-medium text-[#666666] font-dm-sans'>({reviews || 0})</span>
          </div>
        )}

        {priceLine ? (
          <p className='mt-1.5 truncate text-[12px] font-semibold text-[#1E1B4B] font-dm-sans'>
            {priceLine}
          </p>
        ) : null}

        <div className='mt-2.5 grid grid-cols-[minmax(0,1fr)_36px] gap-2'>
          <button
            type='button'
            onClick={onPrimaryClick}
            className={`flex h-9 w-full items-center justify-center rounded-[10px] text-[11px] font-semibold leading-none transition-all duration-[250ms] ease-out active:scale-95 font-dm-sans ${primaryButtonClass(primaryVariant)}`}
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
            className={`flex h-9 w-9 items-center justify-center rounded-[10px] border shadow-sm transition-all duration-[250ms] ease-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans ${
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
        className='relative h-[155px] w-full overflow-hidden rounded-lg bg-transparent p-1.5'
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
          className='h-full w-full rounded-md border-0 bg-transparent shadow-none'
          imageClassName='transition-transform duration-300'
          fit='contain'
          showBackdrop={false}
          fixedAspectRatio={2 / 3}
          variant={coverVariant}
        >
          {coverOverlay}
        </CoverImageFrame>
      </div>

      <div className='flex flex-col pt-2 font-dm-sans'>
        <h3 className='truncate text-[12px] font-semibold leading-tight text-[#1E1B4B] font-dm-sans'>{title}</h3>
        <p className='mt-0.5 truncate text-[10px] font-normal text-[#757575] font-dm-sans'>{author}</p>

        {(rating ?? 0) > 0 && (
          <div className='mt-1 flex items-center gap-1.5'>
            <StarIconSolid className='h-3.5 w-3.5 text-[#5146F7]' />
            <span className='text-[10px] leading-none text-[#1E1B4B] font-dm-sans'>{(rating || 0).toFixed(1)}</span>
            <span className='text-[10px] font-medium text-[#666666] font-dm-sans'>({reviews || 0})</span>
          </div>
        )}

        {priceLine ? (
          <p className='mt-1 truncate text-[10px] font-semibold text-[#1E1B4B] font-dm-sans'>
            {priceLine}
          </p>
        ) : null}

        <div className='mt-1.5 grid grid-cols-[minmax(0,1fr)_32px] gap-2'>
          <button
            type='button'
            onClick={onPrimaryClick}
            className={`flex h-8 w-full items-center justify-center rounded-[10px] text-[10px] font-semibold leading-none transition-all active:scale-95 font-dm-sans ${primaryButtonClass(primaryVariant)}`}
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
            className={`flex h-8 w-8 items-center justify-center rounded-[10px] border shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 font-dm-sans ${
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
