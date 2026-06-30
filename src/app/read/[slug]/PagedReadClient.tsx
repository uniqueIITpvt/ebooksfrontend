'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { freeSummariesApi, type FreeSummary } from '@/services/api/freeSummariesApi';

const WORDS_PER_PAGE = 170;

function chunkWords(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  const pages: string[] = [];

  for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
    pages.push(words.slice(i, i + WORDS_PER_PAGE).join(' '));
  }

  return pages.length ? pages : [''];
}

export default function PagedReadClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<FreeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadSummary = async () => {
      try {
        const data = await freeSummariesApi.getReadPayload(slug);
        if (!ignore) setSummary(data);
      } catch (error: any) {
        if (ignore) return;

        const message = String(error?.message || '');
        if (message.includes('401') || message.toLowerCase().includes('login')) {
          router.replace(`/user/auth?returnUrl=${encodeURIComponent(window.location.pathname)}`);
          return;
        }

        router.replace(`/free-summaries/${slug}`);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadSummary();

    return () => {
      ignore = true;
    };
  }, [router, slug]);

  const pages = useMemo(() => chunkWords(summary?.description || ''), [summary]);
  const currentPage = pages[page] || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f0ea] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-amber-200 border-t-amber-700 animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-[#f2f0ea] py-6 px-4 sm:px-8">
      <button
        onClick={() => router.back()}
        aria-label="Back"
        className="fixed left-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-12 w-12 items-center justify-center rounded-full border border-black/5 bg-white/55 text-stone-300 shadow-sm hover:text-stone-600"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </button>

      <div className="mx-auto max-w-[760px]">
        <div className="relative min-h-[78vh] bg-[#f7f0e5] shadow-2xl ring-1 ring-black/10">
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-[#a47719] via-[#d4aa35] to-[#7b5717]" />
          <div className="px-8 py-10 sm:px-14 sm:py-12">
            <header className="text-center">
              <p className="text-[11px] uppercase tracking-[0.42em] text-[#9b6a2d]">
                {summary.subtitle || summary.category}
              </p>
              <p className="mt-3 text-sm text-[#8b5d23]">Page {page + 1}</p>
              <div className="mt-6 border-t border-[#cfbd9e]" />
            </header>

            <main className="mt-8 min-h-[430px]">
              <p className="font-serif text-[19px] leading-[2.05] text-black sm:text-[21px]">
                <span className="float-left mr-3 mt-1 font-serif text-7xl font-bold leading-[0.8] text-[#bd8a21]">
                  {currentPage.trim().charAt(0)}
                </span>
                {currentPage.trim().slice(1)}
              </p>
            </main>

            <footer className="mt-8 text-center text-sm text-[#8b5d23]">
              - {page + 1} -
            </footer>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-6">
          <button
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            disabled={page === 0}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-stone-500 shadow disabled:opacity-35"
            aria-label="Previous page"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="h-2 w-7 rounded-full bg-[#aa8a32]" />
          <button
            onClick={() => setPage((value) => Math.min(pages.length - 1, value + 1))}
            disabled={page >= pages.length - 1}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-stone-500 shadow disabled:opacity-35"
            aria-label="Next page"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
