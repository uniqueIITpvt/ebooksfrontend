'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownTrayIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { booksApi, type Book } from '@/services/api/booksApi';

const WORDS_PER_PAGE = 170;

function getPdfPageCount(buffer: ArrayBuffer) {
  const text = new TextDecoder('latin1').decode(buffer);
  const pageMatches = text.match(/\/Type\s*\/Page\b/g);
  const pagesTreeCounts = Array.from(text.matchAll(/\/Type\s*\/Pages[\s\S]{0,300}?\/Count\s+(\d+)/g))
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);
  const maxPagesTreeCount = pagesTreeCounts.length ? Math.max(...pagesTreeCounts) : 0;

  return Math.max(pageMatches?.length || 0, maxPagesTreeCount, 1);
}

function chunkWords(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  const pages: string[] = [];

  for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
    pages.push(words.slice(i, i + WORDS_PER_PAGE).join(' '));
  }

  return pages.length ? pages : [''];
}

export default function BookReadClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [pdfPreviewError, setPdfPreviewError] = useState('');
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfPageChanging, setPdfPageChanging] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(1);

  useEffect(() => {
    let ignore = false;

    const loadBook = async () => {
      try {
        const response = await booksApi.getReadPayload(slug);
        if (!ignore && response.success) {
          setBook(response.data);
        }
      } catch (error: any) {
        if (ignore) return;

        const message = String(error?.message || '');
        if (message.includes('401') || message.toLowerCase().includes('login')) {
          router.replace(`/user/auth?returnUrl=${encodeURIComponent(window.location.pathname)}`);
          return;
        }

        router.replace(`/books/${slug}`);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadBook();

    return () => {
      ignore = true;
    };
  }, [router, slug]);

  const ebookFile = book?.files?.ebook || null;
  const ebookUrl = ebookFile?.url || '';
  const isPdf =
    ebookFile?.mimeType === 'application/pdf' ||
    ebookUrl.toLowerCase().includes('.pdf');
  const pages = useMemo(() => chunkWords(book?.description || ''), [book?.description]);
  const currentPage = pages[page] || '';

  useEffect(() => {
    if (!ebookUrl || !isPdf) {
      setPdfPreviewUrl('');
      setPdfPreviewError('');
      setPdfPreviewLoading(false);
      setPdfPage(1);
      setPdfPageChanging(false);
      setPdfPageCount(1);
      return;
    }

    let ignore = false;
    let objectUrl = '';

    const loadPdfPreview = async () => {
      setPdfPreviewLoading(true);
      setPdfPreviewError('');
      setPdfPreviewUrl('');
      setPdfPage(1);
      setPdfPageChanging(false);
      setPdfPageCount(1);

      try {
        const response = await fetch(ebookUrl);
        if (!response.ok) {
          throw new Error('Unable to load PDF preview');
        }

        const buffer = await response.arrayBuffer();
        const pdfBlob = new Blob([buffer], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(pdfBlob);

        if (!ignore) {
          setPdfPreviewUrl(objectUrl);
          setPdfPageCount(getPdfPageCount(buffer));
        }
      } catch {
        if (!ignore) {
          setPdfPreviewError('This PDF could not be previewed in the browser.');
        }
      } finally {
        if (!ignore) {
          setPdfPreviewLoading(false);
        }
      }
    };

    loadPdfPreview();

    return () => {
      ignore = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [ebookUrl, isPdf]);

  const getPdfViewerUrl = (pageNumber: number) =>
    `${pdfPreviewUrl}#page=${pageNumber}&zoom=page-fit&view=Fit&toolbar=0&navpanes=0&scrollbar=0&pagemode=none`;

  const goToPdfPage = (nextPage: number) => {
    if (!isPdf || !pdfPreviewUrl) return;

    const boundedPage = Math.min(pdfPageCount, Math.max(1, nextPage));
    if (boundedPage === pdfPage) return;

    setPdfPageChanging(true);
    setPdfPage(boundedPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f0ea] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-amber-200 border-t-amber-700 animate-spin" />
      </div>
    );
  }

  if (!book) return null;

  if (ebookUrl) {
    return (
      <div className="min-h-screen bg-[#f2f0ea] px-0 py-3 sm:px-8 sm:py-6">
        <button
          onClick={() => router.push('/profile?tab=library')}
          aria-label="Back to library"
          title="Back to library"
          className="fixed left-3 top-20 z-30 flex items-center gap-2 rounded-full border border-stone-200 bg-white/95 px-3 py-2 text-sm font-semibold text-stone-700 shadow-lg hover:bg-white hover:text-stone-950 md:top-1/2 md:-translate-y-1/2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Library</span>
        </button>

        <div className="mx-auto w-full max-w-[760px] px-2 sm:px-0">
          <div className="relative aspect-[210/297] overflow-hidden bg-[#f7f0e5] shadow-2xl ring-1 ring-black/10">
            <div className="absolute inset-y-0 left-0 z-10 w-3 bg-gradient-to-r from-[#a47719] via-[#d4aa35] to-[#7b5717]" />

            {isPdf ? (
              pdfPreviewLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-2 border-amber-200 border-t-amber-700 animate-spin" />
                </div>
              ) : pdfPreviewUrl ? (
                <div
                  className="absolute inset-0 touch-none overflow-hidden overscroll-none bg-[#f7f0e5]"
                >
                  <iframe
                    key={`pdf-page-${pdfPage}`}
                    title={`${book.title} page ${pdfPage}`}
                    src={getPdfViewerUrl(pdfPage)}
                    scrolling="no"
                    onLoad={() => setPdfPageChanging(false)}
                    className="pointer-events-none h-full w-full border-0 bg-[#f7f0e5]"
                  />
                  {pdfPageChanging ? (
                    <div className="absolute inset-0 bg-[#f7f0e5]" />
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <p className="max-w-md text-stone-600">
                    {pdfPreviewError || 'This PDF could not be previewed in the browser.'}
                  </p>
                  <a
                    href={ebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Open PDF File
                  </a>
                </div>
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <p className="max-w-md text-stone-600">
                  This ebook file type cannot be previewed directly in the browser.
                </p>
                <a
                  href={ebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Open Ebook File
                </a>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-6">
            <button
              onClick={() => goToPdfPage(pdfPage - 1)}
              disabled={!isPdf || pdfPage <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-stone-500 shadow disabled:text-stone-300 disabled:opacity-60"
              aria-label="Previous page"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex h-2 w-7 items-center justify-center rounded-full bg-[#aa8a32]" />
            <button
              onClick={() => goToPdfPage(pdfPage + 1)}
              disabled={!isPdf || pdfPage >= pdfPageCount}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-stone-500 shadow disabled:text-stone-300 disabled:opacity-60"
              aria-label="Next page"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f0ea] py-6 px-4 sm:px-8">
      <button
        onClick={() => router.push('/profile?tab=library')}
        aria-label="Back to library"
        title="Back to library"
        className="fixed left-3 top-20 z-30 flex items-center gap-2 rounded-full border border-stone-200 bg-white/95 px-3 py-2 text-sm font-semibold text-stone-700 shadow-lg hover:bg-white hover:text-stone-950 md:top-1/2 md:-translate-y-1/2"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span className="hidden sm:inline">Library</span>
      </button>

      <div className="mx-auto max-w-[760px]">
        <div className="relative min-h-[78vh] bg-[#f7f0e5] shadow-2xl ring-1 ring-black/10">
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-[#a47719] via-[#d4aa35] to-[#7b5717]" />
          <div className="px-8 py-10 sm:px-14 sm:py-12">
            <header className="text-center">
              <p className="text-[11px] uppercase tracking-[0.42em] text-[#9b6a2d]">
                {book.subtitle || book.category}
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
