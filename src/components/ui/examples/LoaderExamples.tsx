'use client';

import React, { useState } from 'react';
import { 
  Loader, 
  PageLoader, 
  ContentLoader, 
  SkeletonLoader, 
  ImageLoader 
} from '../primitives/Loader';
import { 
  OptimizedImage, 
  BannerImage, 
  GalleryImage, 
  AvatarImage 
} from '../primitives/OptimizedImage';
import { Button } from '../primitives/Button';

/**
 * Comprehensive examples of the Loader and OptimizedImage components
 * Demonstrates loading states, image optimization, and performance enhancements
 */
export default function LoaderExamples() {
  const [showPageLoader, setShowPageLoader] = useState(false);
  const [showContentLoader, setShowContentLoader] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleShowPageLoader = () => {
    setShowPageLoader(true);
    setTimeout(() => setShowPageLoader(false), 3000);
  };

  const handleShowContentLoader = () => {
    setShowContentLoader(true);
    setTimeout(() => setShowContentLoader(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      {/* Page Loader Demo */}
      {showPageLoader && (
        <PageLoader 
          variant="spinner" 
          size="xl" 
          message="Loading application..." 
        />
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Loader & Image Optimization Examples
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Fast loading components with optimized images and beautiful loading states
        </p>
      </div>

      {/* Loader Variants */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Loader Variants</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Spinner Loaders */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Spinner Loaders</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Loader variant="spinner" size="xs" color="primary" />
                <span className="text-sm">Extra Small</span>
              </div>
              <div className="flex items-center gap-4">
                <Loader variant="spinner" size="sm" color="primary" />
                <span className="text-sm">Small</span>
              </div>
              <div className="flex items-center gap-4">
                <Loader variant="spinner" size="default" color="primary" />
                <span className="text-sm">Default</span>
              </div>
              <div className="flex items-center gap-4">
                <Loader variant="spinner" size="lg" color="primary" />
                <span className="text-sm">Large</span>
              </div>
            </div>
          </div>

          {/* Dots Loaders */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Dots Loaders</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Loader variant="dots" size="sm" color="primary" />
                <span className="text-sm">Small</span>
              </div>
              <div className="flex items-center gap-4">
                <Loader variant="dots" size="default" color="primary" />
                <span className="text-sm">Default</span>
              </div>
              <div className="flex items-center gap-4">
                <Loader variant="dots" size="lg" color="secondary" />
                <span className="text-sm">Large</span>
              </div>
            </div>
          </div>

          {/* Other Variants */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Other Variants</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Loader variant="pulse" size="default" color="primary" />
                <span className="text-sm">Pulse</span>
              </div>
              <div className="flex items-center gap-4">
                <Loader variant="bars" size="default" color="primary" />
                <span className="text-sm">Bars</span>
              </div>
              <div className="flex items-center gap-4">
                <Loader variant="ring" size="default" color="primary" />
                <span className="text-sm">Ring</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page & Content Loaders */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Page & Content Loaders</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Page Loader</h3>
            <p className="text-slate-600 mb-4">Full-screen overlay loader for page transitions</p>
            <Button onClick={handleShowPageLoader} variant="primary">
              Show Page Loader
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Content Loader</h3>
            <p className="text-slate-600 mb-4">Section-specific loading state</p>
            <Button onClick={handleShowContentLoader} variant="secondary">
              Show Content Loader
            </Button>
            {showContentLoader && (
              <div className="mt-4">
                <ContentLoader 
                  variant="dots" 
                  size="lg" 
                  message="Loading content..." 
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Skeleton Loaders */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Skeleton Loaders</h2>
        
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Content Placeholders</h3>
          <div className="space-y-4">
            {/* Card skeleton */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <SkeletonLoader className="w-16 h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <SkeletonLoader className="h-4 w-3/4" />
                  <SkeletonLoader className="h-3 w-1/2" />
                  <SkeletonLoader className="h-3 w-2/3" />
                </div>
              </div>
            </div>

            {/* List skeleton */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <SkeletonLoader className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <SkeletonLoader className="h-3 w-1/3" />
                  <SkeletonLoader className="h-2 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Optimized Images */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Optimized Images</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Banner Image */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="h-48 relative">
              <BannerImage
                src="/hero banner/1.png"
                alt="Banner Example"
                fill
                className="object-cover"
                priority={true}
                overlay={true}
                overlayClassName="bg-black/30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white font-bold text-lg">Banner Image</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600">
                High-priority banner with overlay and blur placeholder
              </p>
            </div>
          </div>

          {/* Gallery Image */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="h-48 relative">
              <GalleryImage
                src="/books/Navy and Pink Illustrated Mind Matters Book Cover.jpg"
                alt="Gallery Example"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Gallery Image</h3>
              <p className="text-sm text-slate-600">
                Lazy-loaded with optimized quality for galleries
              </p>
            </div>
          </div>

          {/* Avatar Images */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Avatar Images</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <AvatarImage
                  src="/SMQ.png"
                  alt="Small Avatar"
                  size="sm"
                  width={32}
                  height={32}
                />
                <span className="text-sm">Small (32px)</span>
              </div>
              <div className="flex items-center gap-3">
                <AvatarImage
                  src="/SMQ.png"
                  alt="Medium Avatar"
                  size="md"
                  width={48}
                  height={48}
                />
                <span className="text-sm">Medium (48px)</span>
              </div>
              <div className="flex items-center gap-3">
                <AvatarImage
                  src="/SMQ.png"
                  alt="Large Avatar"
                  size="lg"
                  width={64}
                  height={64}
                  />
                <span className="text-sm">Large (64px)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Loading States */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Image Loading States</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Image Placeholder</h3>
            <ImageLoader width="w-full" height="h-32" />
            <p className="text-sm text-slate-600 mt-2">
              Shows while images are loading
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Optimized Image with Loader</h3>
            <div className="relative h-32">
              <OptimizedImage
                src="/banner/Parenting Unveiled (1).jpg"
                alt="Optimized Example"
                fill
                className="object-cover rounded"
                showLoader={imageLoading}
                onLoadComplete={() => setImageLoading(false)}
                fallbackSrc="/SMQ.png"
              />
            </div>
            <p className="text-sm text-slate-600 mt-2">
              With fallback and error handling
            </p>
          </div>
        </div>
      </section>

      {/* Performance Tips */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Performance Features</h2>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">🚀 Loader Benefits</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Multiple variants for different contexts</li>
                <li>• Consistent loading states across app</li>
                <li>• Accessible with proper ARIA labels</li>
                <li>• Smooth animations and transitions</li>
                <li>• TypeScript support with variants</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">🖼️ Image Optimization</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Next.js Image component integration</li>
                <li>• Automatic blur placeholders</li>
                <li>• Lazy loading for better performance</li>
                <li>• Error handling with fallbacks</li>
                <li>• Priority loading for above-fold images</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
