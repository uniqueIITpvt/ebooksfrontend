'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { ImageLoader } from './Loader';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  showLoader?: boolean;
  loaderClassName?: string;
  containerClassName?: string;
  onLoadComplete?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc,
  showLoader = true,
  loaderClassName,
  containerClassName,
  className,
  onLoadComplete,
  onError,
  priority = false,
  quality = 90,
  placeholder = 'blur',
  blurDataURL,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Generate blur data URL if not provided
  const defaultBlurDataURL = blurDataURL || 
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

  const handleLoad = () => {
    setIsLoading(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
      setHasError(false);
    }
    
    onError?.();
  };

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {/* Loading state */}
      {isLoading && showLoader && (
        <div className="absolute inset-0 z-10">
          <ImageLoader className={loaderClassName} />
        </div>
      )}

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100">
          <div className="text-center text-slate-400">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Optimized Image */}
      <Image
        src={currentSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={defaultBlurDataURL}
        {...props}
      />
    </div>
  );
};

// Banner-specific optimized image component
export const BannerImage: React.FC<OptimizedImageProps & {
  overlay?: boolean;
  overlayClassName?: string;
}> = ({ 
  overlay = false, 
  overlayClassName,
  containerClassName,
  ...props 
}) => {
  return (
    <div className={cn('relative', containerClassName)}>
      <OptimizedImage
        {...props}
        priority={true} // Banner images should load with priority
        quality={95} // Higher quality for banner images
        placeholder="blur"
      />
      
      {/* Optional overlay */}
      {overlay && (
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent',
          overlayClassName
        )} />
      )}
    </div>
  );
};

// Gallery image component with lazy loading
export const GalleryImage: React.FC<OptimizedImageProps> = (props) => {
  return (
    <OptimizedImage
      {...props}
      priority={false} // Gallery images can load lazily
      quality={85} // Slightly lower quality for gallery
      placeholder="blur"
      loading="lazy"
    />
  );
};

// Avatar/Profile image component
export const AvatarImage: React.FC<OptimizedImageProps & {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ size = 'md', className, ...props }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <OptimizedImage
      {...props}
      className={cn('rounded-full object-cover', sizeClasses[size], className)}
      quality={90}
      placeholder="blur"
    />
  );
};

export default OptimizedImage;