'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Button variants using class-variance-authority for type-safe styling
const buttonVariants = cva(
  // Base styles - common to all buttons
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
  {
    variants: {
      variant: {
        // Primary - matches navbar icon theme colors
        primary: 
          'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:scale-105',
        
        // Secondary - clean white background
        secondary: 
          'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-500 shadow-md hover:shadow-lg',
        
        // Outline - transparent with theme border
        outline: 
          'border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 focus:ring-blue-500 bg-transparent',
        
        // Ghost - minimal styling
        ghost: 
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500',
        
        // Destructive - for delete/danger actions
        destructive: 
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl',
        
        // Success - for positive actions
        success: 
          'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 focus:ring-emerald-500 shadow-lg hover:shadow-xl transform hover:scale-105',
        
        // Warning - for cautionary actions
        warning: 
          'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 focus:ring-orange-500 shadow-lg hover:shadow-xl transform hover:scale-105',
      },
      size: {
        // Extra small - for compact spaces
        xs: 'px-2.5 py-1.5 text-xs rounded-lg',
        
        // Small - for secondary actions
        sm: 'px-3 py-2 text-sm rounded-lg',
        
        // Default - standard button size
        default: 'px-4 py-2.5 text-sm rounded-xl',
        
        // Large - for primary CTAs
        lg: 'px-6 py-3 text-base rounded-xl',
        
        // Extra large - for hero sections
        xl: 'px-8 py-4 text-lg rounded-2xl',
        
        // Icon only - square buttons for icons
        icon: 'p-2.5 rounded-xl',
        
        // Icon small - smaller square buttons
        'icon-sm': 'p-2 rounded-lg',
        
        // Icon large - larger square buttons
        'icon-lg': 'p-3 rounded-xl',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        
        {/* Left icon */}
        {leftIcon && !loading && (
          <span className="flex-shrink-0">
            {leftIcon}
          </span>
        )}
        
        {/* Button content */}
        {children && (
          <span className={cn(
            'flex-1 text-center',
            (leftIcon || rightIcon || loading) && 'mx-1'
          )}>
            {children}
          </span>
        )}
        
        {/* Right icon */}
        {rightIcon && !loading && (
          <span className="flex-shrink-0">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };