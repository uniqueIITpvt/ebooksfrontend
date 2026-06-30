'use client';

import Link from 'next/link';
import {
  BookOpenIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import type { Category } from '@/services/api/categoriesApi';
import { CategoryMenuIcon } from './CategoryMenuIcon';

interface BooksDropdownProps {
  categories: Category[];
  isLoading: boolean;
  onClose: () => void;
}

export default function BooksDropdown({
  categories,
  isLoading,
  onClose,
}: BooksDropdownProps) {
  return (
    <div className='fixed top-20 left-1/2 -translate-x-1/2 w-[680px] max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-blue-200/60 hover:border-blue-300/80 py-5 z-50 animate-in slide-in-from-top-2 duration-300 transition-all'>
      <div className='px-6 mb-4'>
        <div className='flex items-center space-x-3 mb-2'>
          <div className='p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white'>
            <BookOpenIcon className='w-5 h-5' />
          </div>
          <h3 className='text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent'>
            uniqueIIT Research Center Books
          </h3>
        </div>
        <p className='text-xs text-slate-600 ml-12'>
          Browse all book categories and find titles by topic
        </p>
      </div>

      {isLoading ? (
        <div className='px-8 py-12 text-center'>
          <div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4'></div>
          <p className='text-slate-600'>Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className='px-8 py-12 text-center'>
          <div className='text-slate-400 mb-4'>
            <Squares2X2Icon className='w-20 h-20 mx-auto mb-4' />
          </div>
          <h4 className='text-xl font-semibold text-slate-700 mb-2'>
            No Categories Available
          </h4>
          <p className='text-slate-500'>New reading topics coming soon!</p>
        </div>
      ) : (
        <div className='mx-6 max-h-[340px] overflow-y-auto overflow-x-hidden pr-2 [scrollbar-color:#10b981_#e0f2fe] [scrollbar-width:thin]'>
          <div className='grid grid-cols-3 gap-2.5'>
            {categories.map((category) => (
              <Link
                key={category.id || category._id || category.slug}
                href={`/books?category=${encodeURIComponent(category.name)}`}
                onClick={onClose}
                className='group h-[52px] min-w-0 overflow-hidden rounded-xl border-2 border-blue-100/80 bg-gradient-to-br from-white via-blue-50/30 to-emerald-50/30 p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md'
              >
                <div className='flex h-full min-w-0 items-center gap-2.5'>
                  <div
                    className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white shadow-sm'
                    style={{ backgroundColor: category.color || '#059669' }}
                  >
                    <CategoryMenuIcon category={category} className='h-5 w-5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex min-w-0 items-center gap-2'>
                      <h4 className='truncate text-sm font-bold text-slate-800 transition-colors group-hover:text-emerald-700'>
                        {category.name}
                      </h4>
                      <span className='flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold leading-none text-emerald-700'>
                        {category.bookCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* {categories.length > 0 && (
        <div className='px-6 mt-3 pt-3 border-t border-emerald-100/50'>
          <Link
            href='/books'
            onClick={onClose}
            className='flex items-center justify-center w-full py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-xs font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 hover:shadow-lg'
          >
            <BookOpenIcon className='w-4 h-4 mr-2' />
            Explore All Books
          </Link>
        </div>
      )} */}
    </div>
  );
}
