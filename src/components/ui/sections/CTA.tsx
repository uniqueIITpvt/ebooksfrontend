'use client';

import { useState } from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
} from '@heroicons/react/24/solid';
import contactApi from '@/services/api/contactApi';

export default function CTA() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/contact`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: 'Contact from Landing Page',
          message: formData.message
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        throw new Error(responseData.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending contact message:', error);
      // Show error message instead of success for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSubmitted) {
    return (
      <section className='py-4 sm:py-8 lg:py-12 bg-gradient-to-br from-slate-50 via-white to-green-50/30 relative overflow-hidden'>
        {/* Success Background */}
        <div className='absolute inset-0 opacity-30'>
          <div className='absolute top-10 right-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-10 left-10 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-pulse delay-1000'></div>
        </div>

        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
          <div className='bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-green-100 p-8 md:p-12 text-center'>
            <div className='text-8xl mb-6 animate-bounce'>🎉</div>
            <div className='inline-flex items-center bg-green-100 text-green-800 px-6 py-3 rounded-full text-sm font-semibold mb-6'>
              <CheckCircleIconSolid className='w-5 h-5 mr-2 text-green-600' />
              Message Sent Successfully!
            </div>
            <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
              Thank You for Reaching Out!
            </h2>
            <p className='text-xl text-slate-600 mb-8 leading-relaxed'>
              Your message has been received. UniqueIIT Research Center will get back to you within 24 hours.
            </p>

            <button
              onClick={() => setIsSubmitted(false)}
              suppressHydrationWarning
              className='bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105'
            >
              Send Another Message
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='py-4 sm:py-8 lg:py-12 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden'>
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-5'>
        <div
          className='w-full h-full bg-repeat'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className='absolute top-20 left-10 w-20 h-20 bg-blue-200/20 rounded-full blur-xl animate-pulse' />
      <div className='absolute bottom-20 right-10 w-32 h-32 bg-indigo-200/20 rounded-full blur-xl animate-pulse delay-1000' />
      <div className='absolute top-1/2 left-1/4 w-16 h-16 bg-purple-200/20 rounded-full blur-xl animate-pulse delay-500' />

      <div className='mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative'>
        <div className='relative overflow-hidden rounded-[28px] border border-blue-100 bg-white/90 p-6 shadow-[0_24px_70px_rgba(0,87,184,0.12)] backdrop-blur-sm sm:p-8 lg:p-10'>
          <div className='absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0057b8] via-[#00a6d6] to-[#f58220]' />
          <div className='absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0057b8]/10 blur-3xl' />
          <div className='absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#f58220]/10 blur-3xl' />
          {/* Header */}
          <div className='relative mx-auto mb-8 flex max-w-3xl flex-col items-center text-center'>
            <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057b8] via-[#00a6d6] to-[#f58220] text-white shadow-lg'>
              <ChatBubbleLeftRightIcon className='h-7 w-7' />
            </div>
            <p className='text-sm font-bold uppercase tracking-[0.22em] text-[#0057b8]'>
              Get In Touch
            </p>

            <h1 className='mt-3 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl'>
              Connect with uniqueIIT Research Center
            </h1>
            <p className='mt-4 text-sm leading-6 text-slate-600 sm:text-base'>
              Have a question about our books, audiobooks, or research resources? Email us at{' '}
              <a
                href="mailto:unquebookpublishinghouse@gmail.com"
                className="font-semibold text-[#0057b8] hover:underline"
              >
                unquebookpublishinghouse@gmail.com
            </a>
            <span className='hidden'>
              {' '}and we’ll respond within 24 hours.
            </span>
            <span> and we will respond within 24 hours.</span>
            </p>
          </div>

          {/* Simple Contact Form */}
          <div className='relative rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg backdrop-blur-sm sm:p-6 lg:p-8'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {submitError ? (
                <div className='rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
                  {submitError}
                </div>
              ) : null}

              {/* Name Field */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Full Name *
                </label>
                <div className='relative'>
                  <UserIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                  <input
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    suppressHydrationWarning
                    className='w-full pl-10 pr-4 py-3 bg-white border border-blue-100 rounded-2xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[#00a6d6] focus:ring-2 focus:ring-[#00a6d6]/15 transition-all duration-300'
                    placeholder='Enter your full name'
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Email Address *
                </label>
                <div className='relative'>
                  <EnvelopeIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    suppressHydrationWarning
                    className='w-full pl-10 pr-4 py-3 bg-white border border-blue-100 rounded-2xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[#00a6d6] focus:ring-2 focus:ring-[#00a6d6]/15 transition-all duration-300'
                    placeholder='Enter your email address'
                  />
                </div>
              </div>

              {/* Message Field */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Your Message *
                </label>
                <div className='relative'>
                  <ChatBubbleLeftRightIcon className='absolute left-3 top-3 w-5 h-5 text-slate-400' />
                  <textarea
                    name='message'
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    suppressHydrationWarning
                    className='w-full pl-10 pr-4 py-3 bg-white border border-blue-100 rounded-2xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[#00a6d6] focus:ring-2 focus:ring-[#00a6d6]/15 transition-all duration-300 resize-none'
                    placeholder='What would you like to ask or discuss?'
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={isLoading}
                suppressHydrationWarning
                className='w-full bg-gradient-to-r from-[#0057b8] to-[#00a6d6] text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
              >
                {isLoading ? (
                  <div className='flex items-center justify-center'>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                    Sending Message...
                  </div>
                ) : (
                  <div className='flex items-center justify-center'>
                    <ChatBubbleLeftRightIcon className='w-5 h-5 mr-2' />
                    Send Message
                    <ArrowRightIcon className='w-4 h-4 ml-2' />
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
