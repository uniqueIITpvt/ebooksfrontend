'use client';

import { useState } from 'react';
import ContactForm from '@/components/ui/sections/ContactForm';
import ContactInfoPopup from '@/components/ui/sections/ContactInfoPopup';

export default function ContactPage() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 via-indigo-50 to-white font-dm-sans">
      {/* Hero Section */}
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1300px] overflow-hidden rounded-[18px] bg-gradient-to-r from-blue-100/90 via-indigo-100/80 to-purple-100/80 px-6 py-12 md:py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700">
              Contact Support
            </div>
            <h1 className="mb-4 font-syne text-4xl font-bold text-[#1E1B4B] md:text-5xl">
              Contact Us
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              We're here to help and answer any questions you might have about our books, audiobooks, and research content.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ContactForm className="bg-white/45 shadow-none" />
        
        {/* Contact Info Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => setIsPopupOpen(true)}
            className="inline-flex items-center rounded-lg bg-white/70 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-white"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Need Help? View Contact Information
          </button>
        </div>
      </div>

      {/* Contact Info Popup */}
      <ContactInfoPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </div>
  );
}
