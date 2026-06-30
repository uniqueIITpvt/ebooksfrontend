'use client';

import Link from 'next/link';

export default function LendingPage() {
  return (
    <main className='min-h-screen pt-24 pb-12 bg-gradient-to-br from-white via-slate-50 to-indigo-50/30'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-3xl sm:text-4xl font-bold text-slate-900 mb-4'>Lending</h1>
        <p className='text-slate-600 mb-8'>
          Explore lending options for books and audiobooks.
        </p>

        <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-6'>
          <h2 className='text-xl font-semibold text-slate-900 mb-2'>How it works</h2>
          <p className='text-slate-600 mb-6'>
            Lending details will appear here.
          </p>

          <div className='flex flex-col sm:flex-row gap-3'>
            <Link
              href='/books'
              className='inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white px-5 py-3 text-sm font-semibold hover:bg-indigo-700 transition-colors'
            >
              Browse Books
            </Link>
            <Link
              href='/about'
              className='inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
