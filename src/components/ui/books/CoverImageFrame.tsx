'use client';

import { useEffect, useState, type CSSProperties, type ReactNode, type SyntheticEvent } from 'react';
import Image from 'next/image';

const DEFAULT_ASPECT_RATIO = 2 / 3;
const DEFAULT_BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+E=';
const VARIANT_ASPECT_RATIOS = {
  book: 2 / 3,
  audiobook: 0.7,
} as const;
const VARIANT_BACKDROP_CLASSNAMES = {
  book: 'scale-[1.14] blur-2xl opacity-60 saturate-[1.18]',
  audiobook: 'scale-[1.18] blur-2xl opacity-70 saturate-[1.24]',
  generic: 'scale-110 blur-xl opacity-55 saturate-110',
} as const;
const VARIANT_BACKDROP_OVERLAYS = {
  book: 'bg-gradient-to-b from-white/12 via-transparent to-black/16',
  audiobook: 'bg-gradient-to-b from-white/10 via-black/5 to-black/22',
  generic: 'bg-black/10',
} as const;

export type CoverImageVariant = 'book' | 'audiobook' | 'generic';

interface CoverImageFrameProps {
  src?: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  backdropClassName?: string;
  placeholderClassName?: string;
  children?: ReactNode;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  quality?: number;
  style?: CSSProperties;
  fit?: 'cover' | 'contain';
  showBackdrop?: boolean;
  fixedAspectRatio?: number;
  variant?: CoverImageVariant;
}

export default function CoverImageFrame({
  src,
  alt,
  sizes,
  className = '',
  imageClassName = '',
  backdropClassName = '',
  placeholderClassName = '',
  children,
  priority = false,
  loading = 'lazy',
  quality = 75,
  style,
  fit = 'cover',
  showBackdrop = false,
  fixedAspectRatio,
  variant = 'generic',
}: CoverImageFrameProps) {
  const preferredAspectRatio = fixedAspectRatio ?? VARIANT_ASPECT_RATIOS[variant as keyof typeof VARIANT_ASPECT_RATIOS];
  const [naturalAspectRatio, setNaturalAspectRatio] = useState(preferredAspectRatio ?? DEFAULT_ASPECT_RATIO);

  useEffect(() => {
    setNaturalAspectRatio(preferredAspectRatio ?? DEFAULT_ASPECT_RATIO);
  }, [preferredAspectRatio]);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    if (preferredAspectRatio) return;

    const imageElement = event.currentTarget;
    const nextAspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;

    if (Number.isFinite(nextAspectRatio) && nextAspectRatio > 0) {
      setNaturalAspectRatio(nextAspectRatio);
    }
  };

  const resolvedAspectRatio = preferredAspectRatio ?? naturalAspectRatio;

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        ...style,
        aspectRatio: resolvedAspectRatio,
      }}
    >
      {src ? (
        showBackdrop && fit === 'contain' ? (
          <>
            <div
              aria-hidden='true'
              className={`absolute inset-0 bg-center bg-cover ${VARIANT_BACKDROP_CLASSNAMES[variant]} ${backdropClassName}`}
              style={{ backgroundImage: `url("${src}")` }}
            />
            <div className={`absolute inset-0 h-full w-full ${VARIANT_BACKDROP_OVERLAYS[variant]}`}>
              <Image
                src={src}
                alt={alt}
                fill
                sizes={sizes}
                priority={priority}
                loading={loading}
                quality={quality}
                placeholder='blur'
                blurDataURL={DEFAULT_BLUR_DATA_URL}
                className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} object-center ${imageClassName}`}
                onLoad={handleLoad}
              />
            </div>
          </>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            loading={loading}
            quality={quality}
            placeholder='blur'
            blurDataURL={DEFAULT_BLUR_DATA_URL}
            className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} object-center ${imageClassName}`}
            onLoad={handleLoad}
          />
        )
      ) : (
        <div className={`absolute inset-0 flex items-center justify-center bg-slate-100 ${placeholderClassName}`}>
          <span className='text-xs text-slate-400'>No Image</span>
        </div>
      )}

      {children}
    </div>
  );
}
