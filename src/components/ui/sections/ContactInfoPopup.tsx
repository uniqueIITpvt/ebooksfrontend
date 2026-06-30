'use client';

import { useState } from 'react';
import { XMarkIcon, EnvelopeIcon, ClockIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface ContactInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactInfoPopup({ isOpen, onClose }: ContactInfoPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Contact Information & Support</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Email Support Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center border border-blue-100">
              <div className="flex justify-center items-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <EnvelopeIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 font-medium mb-1">unquebookpublishinghouse@gmail.com</p>
              <p className="text-sm text-gray-500">We respond within 24-48 hours</p>
              <a
                href="mailto:unquebookpublishinghouse@gmail.com"
                className="inline-flex items-center justify-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Send Email
              </a>
            </div>

            {/* Response Time Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center border border-green-100">
              <div className="flex justify-center items-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <ClockIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Time</h3>
              <p className="text-gray-600 font-medium">Monday - Friday</p>
              <p className="text-sm text-gray-500">9:00 AM - 6:00 PM IST</p>
              <div className="mt-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Available Now
              </div>
            </div>

            {/* Help Topics Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center border border-purple-100">
              <div className="flex justify-center items-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                <QuestionMarkCircleIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Help Topics</h3>
              <p className="text-gray-600 font-medium">Books, Audiobooks</p>
              <p className="text-sm text-gray-500">Technical support, Feedback</p>
              <div className="mt-4 space-y-1">
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Subscriptions</span>
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs ml-1">Account</span>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Frequently Asked Questions</h3>
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">How do I access my purchased books?</h4>
                <p className="text-gray-600 text-sm">After purchase, you can access your books from your dashboard under "My Library".</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Can I download audiobooks for offline listening?</h4>
                <p className="text-gray-600 text-sm">Yes, premium members can download audiobooks for offline access.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">How do I cancel my subscription?</h4>
                <p className="text-gray-600 text-sm">You can cancel your subscription anytime from your account settings.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">What payment methods do you accept?</h4>
                <p className="text-gray-600 text-sm">We accept all major credit cards, debit cards, and popular digital payment methods.</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/contact'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Contact Form
            </button>
            <button
              onClick={() => window.location.href = '/faq'}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              View FAQ
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
