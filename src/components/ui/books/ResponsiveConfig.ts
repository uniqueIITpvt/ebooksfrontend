/**
 * Responsive Design Configuration for Books Page
 * 
 * This file defines all responsive breakpoints, utilities, and constants
 * used across the books page components for consistent responsive behavior.
 */

// Standard Tailwind breakpoints
export const BREAKPOINTS = {
  xs: '475px',   // Extra small devices (large phones)
  sm: '640px',   // Small devices (tablets)
  md: '768px',   // Medium devices (small laptops)
  lg: '1024px',  // Large devices (laptops/desktops)
  xl: '1280px',  // Extra large devices (large desktops)
  '2xl': '1536px' // Ultra wide screens
} as const;

// Responsive grid configurations
export const GRID_CONFIGS = {
  books: {
    mobile: 'grid-cols-1',           // 1 column on mobile
    mobileLarge: 'xs:grid-cols-2',   // 2 columns on large mobile
    tablet: 'sm:grid-cols-2',        // 2 columns on tablet
    tabletLarge: 'md:grid-cols-3',   // 3 columns on large tablet
    desktop: 'lg:grid-cols-3',       // 3 columns on desktop
    desktopLarge: 'xl:grid-cols-4',  // 4 columns on large desktop
    ultraWide: '2xl:grid-cols-5'     // 5 columns on ultra-wide
  }
} as const;

// Responsive spacing utilities
export const SPACING = {
  container: {
    padding: 'px-3 xs:px-4 sm:px-6 lg:px-8',
    maxWidth: 'max-w-7xl mx-auto'
  },
  section: {
    vertical: 'py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16',
    hero: 'py-8 xs:py-10 sm:py-12 md:py-16 lg:py-20'
  },
  gaps: {
    small: 'gap-2 xs:gap-3 sm:gap-4',
    medium: 'gap-4 xs:gap-5 sm:gap-6 lg:gap-8',
    large: 'gap-6 xs:gap-8 sm:gap-10 lg:gap-12'
  }
} as const;

// Responsive typography
export const TYPOGRAPHY = {
  hero: {
    title: 'text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
    subtitle: 'text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl'
  },
  section: {
    title: 'text-2xl xs:text-3xl sm:text-4xl lg:text-5xl',
    subtitle: 'text-base xs:text-lg sm:text-xl md:text-2xl'
  },
  card: {
    title: 'text-sm xs:text-base sm:text-lg lg:text-xl',
    description: 'text-xs xs:text-sm sm:text-base',
    caption: 'text-xs sm:text-sm'
  },
  button: {
    small: 'text-xs xs:text-sm',
    medium: 'text-sm xs:text-base',
    large: 'text-base xs:text-lg lg:text-xl'
  }
} as const;

// Component sizes for different breakpoints
export const COMPONENT_SIZES = {
  hero: {
    height: 'h-[140px] xs:h-[160px] sm:h-[200px] md:h-[280px] lg:h-[360px] xl:h-[400px] 2xl:h-[440px]'
  },
  bookCard: {
    height: 'clamp(320px, 40vw, 480px)',
    minHeight: '320px',
    maxHeight: '480px',
    blob: 'clamp(100px, 15vw, 150px)'
  },
  audioPlayer: {
    padding: 'p-3 xs:p-4 sm:p-5',
    coverSize: 'w-10 h-10 xs:w-12 xs:h-12'
  }
} as const;

// Touch and interaction utilities
export const TOUCH_UTILITIES = {
  manipulation: 'touch-manipulation',
  minTouchTarget: 'min-h-[44px] min-w-[44px]', // iOS guidelines
  tapHighlight: 'tap-highlight-transparent'
} as const;

// Safe area utilities for mobile devices
export const SAFE_AREA = {
  bottom: 'safe-area-inset-bottom',
  top: 'safe-area-inset-top',
  left: 'safe-area-inset-left',
  right: 'safe-area-inset-right'
} as const;

// Form input responsive styles
export const FORM_STYLES = {
  input: {
    base: 'w-full border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200',
    padding: 'px-4 py-3 xs:px-5 xs:py-3.5 sm:px-6 sm:py-4',
    text: 'text-sm xs:text-base lg:text-lg'
  },
  select: {
    base: 'appearance-none bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    padding: 'px-3 py-2.5 xs:px-4 xs:py-3.5 pr-8',
    text: 'text-sm xs:text-base'
  }
} as const;

// Animation and transition utilities
export const ANIMATIONS = {
  hover: 'transition-all duration-300',
  fade: 'transition-opacity duration-500',
  slide: 'transition-transform duration-500',
  blob: 'animate-[blob-bounce_5s_infinite_ease]'
} as const;

// Responsive image sizing
export const IMAGE_SIZES = {
  hero: '100vw',
  bookCover: `
    (max-width: 475px) 50vw,
    (max-width: 640px) 50vw,
    (max-width: 768px) 33vw,
    (max-width: 1024px) 33vw,
    (max-width: 1280px) 25vw,
    20vw
  `,
  audioCover: '48px',
  icon: '24px'
} as const;

// Media query utilities for JavaScript
export const MEDIA_QUERIES = {
  isMobile: `(max-width: ${BREAKPOINTS.md})`,
  isTablet: `(min-width: ${BREAKPOINTS.md}) and (max-width: ${BREAKPOINTS.lg})`,
  isDesktop: `(min-width: ${BREAKPOINTS.lg})`,
  isTouch: '(hover: none) and (pointer: coarse)',
  isReducedMotion: '(prefers-reduced-motion: reduce)'
} as const;

// Utility function to combine responsive classes
export const combineResponsiveClasses = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};

// Utility function to get responsive container classes
export const getContainerClasses = (fullWidth = false) => {
  return combineResponsiveClasses(
    fullWidth ? 'w-full' : SPACING.container.maxWidth,
    SPACING.container.padding
  );
};

// Utility function to get responsive grid classes
export const getGridClasses = (type: keyof typeof GRID_CONFIGS = 'books') => {
  const config = GRID_CONFIGS[type];
  return combineResponsiveClasses(
    'grid',
    config.mobile,
    config.mobileLarge,
    config.tablet,
    config.tabletLarge,
    config.desktop,
    config.desktopLarge,
    config.ultraWide
  );
};

const ResponsiveConfig = {
  BREAKPOINTS,
  GRID_CONFIGS,
  SPACING,
  TYPOGRAPHY,
  COMPONENT_SIZES,
  TOUCH_UTILITIES,
  SAFE_AREA,
  FORM_STYLES,
  ANIMATIONS,
  IMAGE_SIZES,
  MEDIA_QUERIES,
  combineResponsiveClasses,
  getContainerClasses,
  getGridClasses
};

export default ResponsiveConfig;
