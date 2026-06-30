'use client';

import React from 'react';
import {
  CalendarDaysIcon,
  ArrowRightIcon,
  PlayIcon,
  BookOpenIcon,
  VideoCameraIcon,
  NewspaperIcon,
  UserIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../primitives/Button';

/**
 * Integration example showing how to use the custom Button component
 * in place of existing button implementations throughout the app
 */

// Example: Replacing CTA buttons
export function CTASection() {
  return (
    <section className="py-16 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Ready to Transform Your Life?
        </h2>
        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
          Take the first step towards better knowledge with curated reads.
        </p>
        
        {/* Using new Button component instead of inline button classes */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button 
            variant="primary" 
            size="xl"
            leftIcon={<CalendarDaysIcon className="w-5 h-5" />}
            rightIcon={<ArrowRightIcon className="w-4 h-4" />}
          >
            Book Consultation
          </Button>
          <Button 
            variant="secondary" 
            size="xl"
            leftIcon={<PlayIcon className="w-5 h-5" />}
          >
            Listen to Podcast
          </Button>
        </div>
      </div>
    </section>
  );
}

// Example: Navbar-style buttons with theme colors
export function NavbarButtons() {
  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="primary" 
        size="sm"
        leftIcon={
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <BookOpenIcon className="w-4 h-4" />
          </div>
        }
      >
        Books
      </Button>
      <Button 
        variant="primary" 
        size="sm"
        leftIcon={
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <VideoCameraIcon className="w-4 h-4" />
          </div>
        }
      >
        YouTube
      </Button>
      <Button 
        variant="primary" 
        size="sm"
        leftIcon={
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <NewspaperIcon className="w-4 h-4" />
          </div>
        }
      >
        Blog
      </Button>
    </div>
  );
}

// Example: Media interaction buttons
export function MediaControls() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon-sm">
        <HeartIcon className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon-sm">
        <BookmarkIcon className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon-sm">
        <ShareIcon className="w-4 h-4" />
      </Button>
      <Button variant="primary" size="sm" rightIcon={<PlayIcon className="w-4 h-4" />}>
        Watch Now
      </Button>
    </div>
  );
}

// Example: Mobile-responsive action buttons
export function MobileActionButtons() {
  return (
    <div className="space-y-4">
      {/* Stack on mobile, row on larger screens */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="primary" fullWidth className="sm:flex-1">
          Primary Action
        </Button>
        <Button variant="secondary" fullWidth className="sm:flex-1">
          Secondary Action
        </Button>
      </div>
      
      {/* Different sizes for different screen sizes */}
      <Button 
        variant="primary" 
        fullWidth
        size="sm"
        className="sm:w-auto sm:px-8 md:text-base md:px-12"
        leftIcon={<UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
      >
        Responsive Button
      </Button>
    </div>
  );
}

// Example: Form buttons with loading states
export function FormButtons() {
  const [loading, setLoading] = React.useState(false);
  
  const handleSubmit = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button 
        variant="outline" 
        size="lg"
        type="button"
      >
        Cancel
      </Button>
      <Button 
        variant="primary" 
        size="lg"
        loading={loading}
        onClick={handleSubmit}
        type="submit"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}

// Example: Card action buttons
export function CardActions() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h3 className="text-xl font-semibold text-slate-900 mb-4">
        Learning Resources
      </h3>
      <p className="text-slate-600 mb-6">
        Access our comprehensive collection of therapeutic materials and guides.
      </p>
      
      <div className="flex flex-wrap gap-3">
        <Button 
          variant="primary" 
          size="sm"
          leftIcon={<BookOpenIcon className="w-4 h-4" />}
        >
          View Resources
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          leftIcon={<BookmarkIcon className="w-4 h-4" />}
        >
          Save for Later
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          leftIcon={<ShareIcon className="w-4 h-4" />}
        >
          Share
        </Button>
      </div>
    </div>
  );
}

// Main integration demo component
export default function ButtonIntegration() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Button Component Integration
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Examples showing how to integrate the custom Button component 
            with your existing theme colors and responsive design patterns.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">CTA Section</h2>
            <CTASection />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Navbar-style Buttons</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <NavbarButtons />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Media Controls</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <MediaControls />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Mobile Responsive Actions</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <MobileActionButtons />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Form Buttons</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <FormButtons />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Card Actions</h2>
            <CardActions />
          </section>
        </div>
      </div>
    </div>
  );
}