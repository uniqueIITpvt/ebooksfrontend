'use client';

import React, { useState } from 'react';
import { Button } from '../primitives/Button';
import {
  HeartIcon,
  UserIcon,
  ArrowRightIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  ShareIcon,
  PlayIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

/**
 * Comprehensive examples of the custom Button component
 * Demonstrates all variants, sizes, and responsive behavior
 * Matches the theme colors from navbar icons (from-blue-500 to-indigo-600)
 */
export default function ButtonExamples() {
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Custom Button Component
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Fully responsive buttons matching the navbar theme colors with multiple variants, 
          sizes, and interactive states. Built with accessibility and performance in mind.
        </p>
      </div>

      {/* Primary Variants - Theme Colors */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Primary Variants (Theme Colors)</h2>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="primary" leftIcon={<CalendarDaysIcon className="w-5 h-5" />}>
              Book Consultation
            </Button>
            <Button variant="primary" rightIcon={<ArrowRightIcon className="w-4 h-4" />}>
              Get Started
            </Button>
            <Button variant="primary" loading={loading} onClick={handleLoadingDemo}>
              {loading ? 'Processing...' : 'Click for Loading'}
            </Button>
          </div>
        </div>
      </section>

      {/* All Button Variants */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Button Variants</h2>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="primary" leftIcon={<PlayIcon className="w-4 h-4" />}>
              Primary
            </Button>
            <Button variant="secondary" leftIcon={<UserIcon className="w-4 h-4" />}>
              Secondary
            </Button>
            <Button variant="outline" leftIcon={<BookmarkIcon className="w-4 h-4" />}>
              Outline
            </Button>
            <Button variant="ghost" leftIcon={<ShareIcon className="w-4 h-4" />}>
              Ghost
            </Button>
            <Button variant="success" leftIcon={<CheckIcon className="w-4 h-4" />}>
              Success
            </Button>
            <Button variant="warning" leftIcon={<ExclamationTriangleIcon className="w-4 h-4" />}>
              Warning
            </Button>
            <Button variant="destructive" leftIcon={<TrashIcon className="w-4 h-4" />}>
              Delete
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </div>
      </section>

      {/* Button Sizes */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Button Sizes</h2>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-wrap items-end gap-4">
            <Button variant="primary" size="xs">Extra Small</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="default">Default</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" size="xl" rightIcon={<ArrowRightIcon className="w-5 h-5" />}>
              Extra Large
            </Button>
          </div>
        </div>
      </section>

      {/* Icon Buttons */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Icon Buttons</h2>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" size="icon-sm">
              <PlusIcon className="w-4 h-4" />
            </Button>
            <Button variant="primary" size="icon">
              <HeartIcon className="w-5 h-5" />
            </Button>
            <Button variant="primary" size="icon-lg">
              <MagnifyingGlassIcon className="w-6 h-6" />
            </Button>
            <Button variant="secondary" size="icon">
              <BookmarkIcon className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon">
              <ShareIcon className="w-5 h-5" />
            </Button>
            <Button 
              variant={liked ? "success" : "ghost"} 
              size="icon"
              onClick={() => setLiked(!liked)}
            >
              <HeartIcon className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </section>

      {/* Responsive Full Width */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Responsive & Full Width</h2>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-4">
          <Button variant="primary" fullWidth leftIcon={<CalendarDaysIcon className="w-5 h-5" />}>
            Full Width Primary Button
          </Button>
          <Button variant="secondary" fullWidth>
            Full Width Secondary Button
          </Button>
          
          {/* Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <Button variant="primary" fullWidth>
              Responsive Grid Item 1
            </Button>
            <Button variant="outline" fullWidth>
              Responsive Grid Item 2
            </Button>
          </div>
        </div>
      </section>

      {/* Real-world Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Real-world Usage Examples</h2>
        
        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to Transform Your Learning Journey?
          </h3>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Take the first step towards better mental wellness with our expert guidance and support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="primary" 
              size="lg" 
              leftIcon={<CalendarDaysIcon className="w-5 h-5" />}
              rightIcon={<ArrowRightIcon className="w-4 h-4" />}
            >
              Book Consultation
            </Button>
            <Button variant="secondary" size="lg" leftIcon={<PlayIcon className="w-5 h-5" />}>
              Watch Video
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-900">Newsletter Subscription</h4>
              <p className="text-sm text-slate-600">Get weekly reading tips and insights</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Maybe Later
              </Button>
              <Button variant="primary" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4" />}>
                Subscribe Now
              </Button>
            </div>
          </div>
        </div>

        {/* Media Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h4 className="font-semibold text-slate-900 mb-4">Podcast Player Controls</h4>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="icon">
              <PlayIcon className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <HeartIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <BookmarkIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <ShareIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Mobile Responsive Demo */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Mobile Responsive Behavior</h2>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <p className="text-slate-600 mb-6">
            Resize your browser window to see how buttons adapt to different screen sizes.
          </p>
          
          {/* Stack on mobile, row on desktop */}
          <div className="flex flex-col xs:flex-row gap-3 mb-6">
            <Button variant="primary" className="flex-1">
              Mobile Stack 1
            </Button>
            <Button variant="secondary" className="flex-1">
              Mobile Stack 2
            </Button>
            <Button variant="outline" className="flex-1">
              Mobile Stack 3
            </Button>
          </div>

          {/* Different sizes on different screens */}
          <div className="space-y-4">
            <Button 
              variant="primary" 
              fullWidth 
              size="sm"
              className="sm:w-auto sm:px-8"
              leftIcon={<CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              <span className="text-sm sm:text-base">Responsive Size & Width</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Usage Tips */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Usage Guidelines</h2>
        <div className="bg-slate-50 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">✅ Best Practices</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Use primary variant for main CTAs</li>
                <li>• Use secondary for alternative actions</li>
                <li>• Combine with icons for better UX</li>
                <li>• Use loading state for async actions</li>
                <li>• Make buttons accessible with proper labels</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">📱 Responsive Design</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Buttons stack vertically on mobile</li>
                <li>• Touch-friendly minimum size (44px)</li>
                <li>• Adequate spacing between buttons</li>
                <li>• Readable text at all screen sizes</li>
                <li>• Consistent with navbar theme colors</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}