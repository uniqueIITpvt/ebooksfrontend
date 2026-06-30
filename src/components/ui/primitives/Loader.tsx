'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Loader variants using class-variance-authority
const loaderVariants = cva(
  // Base styles
  'inline-block animate-spin',
  {
    variants: {
      variant: {
        // Spinner - classic rotating circle
        spinner: 'rounded-full border-2 border-solid border-current border-r-transparent',
        
        // Dots - three bouncing dots
        dots: 'flex space-x-1',
        
        // Pulse - pulsing circle
        pulse: 'rounded-full bg-current animate-pulse',
        
        // Bars - animated bars
        bars: 'flex space-x-1 items-end',
        
        // Ring - rotating ring with gradient
        ring: 'rounded-full border-4 border-solid border-transparent border-t-current animate-spin',
        
        // Skeleton - for content placeholders
        skeleton: 'animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]',
      },
      size: {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        default: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
        '2xl': 'w-16 h-16',
      },
      color: {
        primary: 'text-blue-600',
        secondary: 'text-slate-600',
        white: 'text-white',
        current: 'text-current',
      },
    },
    defaultVariants: {
      variant: 'spinner',
      size: 'default',
      color: 'primary',
    },
  }
);

export interface LoaderProps extends VariantProps<typeof loaderVariants> {
  className?: string;
  label?: string;
}

// Individual loader components
const SpinnerLoader: React.FC<LoaderProps> = ({ size, color, className, label }) => (
  <div
    className={cn(loaderVariants({ variant: 'spinner', size, color }), className)}
    role="status"
    aria-label={label || 'Loading'}
  />
);

const DotsLoader: React.FC<LoaderProps> = ({ size, color, className, label }) => (
  <div className={cn('flex space-x-1', className)} role="status" aria-label={label || 'Loading'}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className={cn(
          'rounded-full animate-bounce',
          size === 'xs' && 'w-1 h-1',
          size === 'sm' && 'w-1.5 h-1.5',
          size === 'default' && 'w-2 h-2',
          size === 'lg' && 'w-2.5 h-2.5',
          size === 'xl' && 'w-3 h-3',
          size === '2xl' && 'w-4 h-4',
          color === 'primary' && 'bg-blue-600',
          color === 'secondary' && 'bg-slate-600',
          color === 'white' && 'bg-white',
          color === 'current' && 'bg-current'
        )}
        style={{
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ))}
  </div>
);

const PulseLoader: React.FC<LoaderProps> = ({ size, color, className, label }) => (
  <div
    className={cn(loaderVariants({ variant: 'pulse', size, color }), className)}
    role="status"
    aria-label={label || 'Loading'}
  />
);

const BarsLoader: React.FC<LoaderProps> = ({ size, color, className, label }) => (
  <div className={cn('flex space-x-1 items-end', className)} role="status" aria-label={label || 'Loading'}>
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        className={cn(
          'animate-pulse',
          size === 'xs' && 'w-0.5 h-2',
          size === 'sm' && 'w-0.5 h-3',
          size === 'default' && 'w-1 h-4',
          size === 'lg' && 'w-1 h-6',
          size === 'xl' && 'w-1.5 h-8',
          size === '2xl' && 'w-2 h-12',
          color === 'primary' && 'bg-blue-600',
          color === 'secondary' && 'bg-slate-600',
          color === 'white' && 'bg-white',
          color === 'current' && 'bg-current'
        )}
        style={{
          animationDelay: `${i * 0.1}s`,
          animationDuration: '1s',
        }}
      />
    ))}
  </div>
);

const RingLoader: React.FC<LoaderProps> = ({ size, color, className, label }) => (
  <div
    className={cn(loaderVariants({ variant: 'ring', size, color }), className)}
    role="status"
    aria-label={label || 'Loading'}
  />
);

// Skeleton loader for content placeholders
export const SkeletonLoader: React.FC<{
  className?: string;
  width?: string;
  height?: string;
}> = ({ className, width = 'w-full', height = 'h-4' }) => (
  <div
    className={cn(
      'animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded',
      width,
      height,
      className
    )}
    style={{
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }}
  />
);

// Main Loader component
export const Loader: React.FC<LoaderProps> = ({ variant = 'spinner', ...props }) => {
  switch (variant) {
    case 'dots':
      return <DotsLoader {...props} />;
    case 'pulse':
      return <PulseLoader {...props} />;
    case 'bars':
      return <BarsLoader {...props} />;
    case 'ring':
      return <RingLoader {...props} />;
    case 'spinner':
    default:
      return <SpinnerLoader {...props} />;
  }
};

// Full page loader component
export const PageLoader: React.FC<{
  variant?: LoaderProps['variant'];
  size?: LoaderProps['size'];
  message?: string;
  className?: string;
}> = ({ variant = 'spinner', size = 'xl', message = 'Loading...', className }) => (
  <div className={cn(
    'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm',
    className
  )}>
    <Loader variant={variant} size={size} color="primary" />
    {message && (
      <p className="mt-4 text-sm font-medium text-slate-600 animate-pulse">
        {message}
      </p>
    )}
  </div>
);

// Content loader for sections
export const ContentLoader: React.FC<{
  variant?: LoaderProps['variant'];
  size?: LoaderProps['size'];
  message?: string;
  className?: string;
}> = ({ variant = 'spinner', size = 'lg', message, className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-4',
    className
  )}>
    <Loader variant={variant} size={size} color="primary" />
    {message && (
      <p className="mt-3 text-sm text-slate-600">
        {message}
      </p>
    )}
  </div>
);

// Image placeholder loader
export const ImageLoader: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({ width = 'w-full', height = 'h-48', className }) => (
  <div className={cn(
    'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded animate-pulse flex items-center justify-center',
    width,
    height,
    className
  )}>
    <svg
      className="w-8 h-8 text-slate-400"
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
  </div>
);

// Add shimmer animation to global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `;
  document.head.appendChild(style);
}

export default Loader;