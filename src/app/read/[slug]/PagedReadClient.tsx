'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsPointingOutIcon,
  Bars3BottomLeftIcon,
  BookmarkIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { freeSummariesApi, type FreeSummary } from '@/services/api/freeSummariesApi';
import { booksApi } from '@/services/api/booksApi';

const WORDS_PER_PAGE = 520;
const READER_PROGRESS_PREFIX = 'techuniqueiit:free-summary-reader';

type ReaderTheme = 'light' | 'sepia' | 'dark';
type ReaderWidth = 'narrow' | 'standard' | 'wide';
type LineSpacing = 'compact' | 'normal' | 'relaxed';

const themeClasses: Record<ReaderTheme, {
  shell: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  control: string;
  active: string;
}> = {
  light: {
    shell: 'bg-gradient-to-r from-blue-50 via-indigo-50 to-white',
    surface: 'bg-white',
    text: 'text-slate-950',
    muted: 'text-slate-500',
    border: 'border-blue-100',
    control: 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700',
    active: 'bg-blue-600 text-white',
  },
  sepia: {
    shell: 'bg-[#f4ecd8]',
    surface: 'bg-[#fff8e8]',
    text: 'text-[#22170d]',
    muted: 'text-[#7b6146]',
    border: 'border-[#e4d2ae]',
    control: 'bg-[#fff8e8] text-[#4d3824] hover:bg-[#f7ebcf] hover:text-[#241506]',
    active: 'bg-[#a66a16] text-white',
  },
  dark: {
    shell: 'bg-[#111827]',
    surface: 'bg-[#182235]',
    text: 'text-slate-100',
    muted: 'text-slate-400',
    border: 'border-slate-700',
    control: 'bg-[#1f2937] text-slate-200 hover:bg-[#273549] hover:text-white',
    active: 'bg-blue-500 text-white',
  },
};

const widthClasses: Record<ReaderWidth, string> = {
  narrow: 'max-w-[640px]',
  standard: 'max-w-[760px]',
  wide: 'max-w-[900px]',
};

const lineHeights: Record<LineSpacing, string> = {
  compact: '1.55',
  normal: '1.8',
  relaxed: '2.05',
};

function chunkWords(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  const pages: string[] = [];

  for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
    pages.push(words.slice(i, i + WORDS_PER_PAGE).join(' '));
  }

  return pages.length ? pages : [''];
}

function splitParagraphs(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.length ? paragraphs : [text.trim()].filter(Boolean);
}

export default function PagedReadClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<FreeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [readerError, setReaderError] = useState('');
  const [page, setPage] = useState(0);
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [readerWidth, setReaderWidth] = useState<ReaderWidth>('standard');
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>('normal');
  const [fontSize, setFontSize] = useState(19);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadSummary = async () => {
      try {
        let data: FreeSummary;
        try {
          data = await freeSummariesApi.getReadPayload(slug);
        } catch {
          const response = await booksApi.getReadPayload(slug);
          data = {
            _id: response.data._id || response.data.id || slug,
            title: response.data.title,
            subtitle: response.data.subtitle,
            slug: response.data.slug || slug,
            author: response.data.author,
            description: response.data.description,
            category: response.data.category,
            pages: response.data.pages,
            publishDate: response.data.publishDate,
            image: response.data.image,
            featured: Boolean(response.data.featured),
            isActive: true,
            views: 0,
            downloads: 0,
            tags: response.data.tags || [],
            createdAt: response.data.createdAt || response.data.publishDate || '',
            updatedAt: response.data.updatedAt || response.data.publishDate || '',
          };
        }
        if (!ignore) setSummary(data);
      } catch (error: any) {
        if (ignore) return;

        const message = String(error?.message || '');
        if (message.includes('401') || message.toLowerCase().includes('login')) {
          router.replace(`/free-summaries/${slug}`);
          return;
        }

        setReaderError(message || 'Unable to open this summary right now.');
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
  const progress = Math.round(((page + 1) / Math.max(pages.length, 1)) * 100);
  const activeTheme = themeClasses[theme];
  const isBookmarked = bookmarkedPages.includes(page);

  const searchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return pages
      .map((content, index) => ({
        index,
        count: (content.toLowerCase().match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length,
      }))
      .filter((match) => match.count > 0);
  }, [pages, searchQuery]);

  useEffect(() => {
    try {
      const rawProgress = localStorage.getItem(`${READER_PROGRESS_PREFIX}:${slug}`);
      const rawBookmarks = localStorage.getItem(`${READER_PROGRESS_PREFIX}:bookmarks:${slug}`);

      if (rawProgress) {
        const saved = JSON.parse(rawProgress) as { page?: number };
        if (Number.isInteger(saved.page)) {
          setPage(Math.min(Math.max(saved.page || 0, 0), Math.max(pages.length - 1, 0)));
        }
      }

      if (rawBookmarks) {
        const savedBookmarks = JSON.parse(rawBookmarks);
        if (Array.isArray(savedBookmarks)) {
          setBookmarkedPages(savedBookmarks.filter((item) => Number.isInteger(item)));
        }
      }
    } catch {}
  }, [pages.length, slug]);

  useEffect(() => {
    if (!summary) return;

    const timer = window.setTimeout(() => {
      localStorage.setItem(`${READER_PROGRESS_PREFIX}:${slug}`, JSON.stringify({
        page,
        completed: progress,
        updatedAt: new Date().toISOString(),
      }));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [page, progress, slug, summary]);

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 0), Math.max(pages.length - 1, 0)));
    setTocOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleBookmark = () => {
    setBookmarkedPages((current) => {
      const next = current.includes(page)
        ? current.filter((item) => item !== page)
        : [...current, page].sort((a, b) => a - b);

      localStorage.setItem(`${READER_PROGRESS_PREFIX}:bookmarks:${slug}`, JSON.stringify(next));
      return next;
    });
  };

  const openFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      return;
    }

    await document.exitFullscreen?.();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-50 via-indigo-50 to-white px-5 py-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-14 rounded-2xl bg-white/80" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr_96px]">
            <div className="hidden h-[70vh] rounded-2xl bg-white/70 lg:block" />
            <div className="h-[78vh] rounded-2xl bg-white/85" />
            <div className="hidden h-[70vh] rounded-2xl bg-white/70 lg:block" />
          </div>
        </div>
      </div>
    );
  }

  if (readerError || !summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-50 via-indigo-50 to-white px-5">
        <div className="w-full max-w-lg rounded-2xl border border-blue-100 bg-white/90 p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">Reader unavailable</h1>
          <p className="mt-3 text-slate-600">
            {readerError || 'This summary could not be opened right now.'}
          </p>
          <button
            type="button"
            onClick={() => router.push(`/free-summaries/${slug}`)}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${activeTheme.shell} ${activeTheme.text}`}>
      <header className={`sticky top-0 z-40 border-b ${activeTheme.border} ${activeTheme.surface}/95 backdrop-blur-xl`}>
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-3 sm:px-5 lg:px-8">
          <button
            type="button"
            onClick={() => router.push(`/free-summaries/${slug}`)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${activeTheme.control}`}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Back to Free Summary</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="min-w-0 flex-1 px-2 text-center sm:text-left">
            <p className={`truncate text-sm font-bold ${activeTheme.text}`}>{summary.title}</p>
            <p className={`truncate text-xs ${activeTheme.muted}`}>
              {summary.subtitle || summary.category} · Page {page + 1} of {pages.length}
            </p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {searchOpen && (
              <div className={`flex h-10 items-center gap-2 rounded-xl border px-3 ${activeTheme.border} ${activeTheme.surface}`}>
                <MagnifyingGlassIcon className={`h-4 w-4 ${activeTheme.muted}`} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search summary"
                  className={`w-44 bg-transparent text-sm outline-none placeholder:text-slate-400 ${activeTheme.text}`}
                />
              </div>
            )}
            <button type="button" onClick={() => setSearchOpen((value) => !value)} className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeTheme.control}`} aria-label="Search">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setSettingsOpen((value) => !value)} className={`flex h-10 items-center justify-center rounded-xl px-3 text-sm font-bold ${activeTheme.control}`} aria-label="Reading settings">
              Aa
            </button>
            <button type="button" onClick={toggleBookmark} className={`flex h-10 w-10 items-center justify-center rounded-xl ${isBookmarked ? activeTheme.active : activeTheme.control}`} aria-label="Bookmark">
              {isBookmarked ? <BookmarkSolidIcon className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
            </button>
            <button type="button" onClick={openFullscreen} className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeTheme.control}`} aria-label="Fullscreen">
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setMoreOpen((value) => !value)} className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeTheme.control}`} aria-label="More menu">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {settingsOpen && (
        <div className="fixed right-4 top-20 z-50 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-blue-100 bg-white p-4 text-slate-950 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Reading Settings</h2>
            <button type="button" onClick={() => setSettingsOpen(false)} className="rounded-full p-1 hover:bg-slate-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Text size</span>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs">A-</span>
                <input
                  type="range"
                  min={16}
                  max={24}
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="w-full accent-blue-600"
                />
                <span className="text-base font-bold">A+</span>
              </div>
            </label>

            <div>
              <p className="text-sm font-semibold text-slate-700">Theme</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['light', 'sepia', 'dark'] as ReaderTheme[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTheme(item)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold capitalize ${
                      theme === item ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">Line spacing</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['compact', 'normal', 'relaxed'] as LineSpacing[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLineSpacing(item)}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold capitalize ${
                      lineSpacing === item ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">Page width</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['narrow', 'standard', 'wide'] as ReaderWidth[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setReaderWidth(item)}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold capitalize ${
                      readerWidth === item ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tocOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden">
          <div className={`h-full w-[min(340px,86vw)] overflow-y-auto border-r p-5 ${activeTheme.border} ${activeTheme.surface}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Contents</h2>
              <button type="button" onClick={() => setTocOpen(false)} className={`rounded-full p-1 ${activeTheme.control}`}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {pages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToPage(index)}
                  className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${
                    page === index ? activeTheme.active : activeTheme.control
                  }`}
                >
                  Page {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-[1440px] gap-5 px-0 pb-24 pt-5 md:px-5 lg:grid-cols-[240px_minmax(0,1fr)_96px] lg:pb-10 lg:pt-6">
        <aside className={`sticky top-[84px] hidden h-[calc(100vh-96px)] rounded-2xl border p-4 lg:block ${activeTheme.border} ${activeTheme.surface}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.22em] ${activeTheme.muted}`}>Contents</p>
          <nav className="mt-4 space-y-1 overflow-y-auto pr-1">
            {pages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToPage(index)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  page === index ? activeTheme.active : activeTheme.control
                }`}
              >
                Page {index + 1}
                <span className={`block text-xs ${page === index ? 'text-white/75' : activeTheme.muted}`}>
                  Summary section
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 px-5 md:px-0">
          <div className={`mx-auto ${widthClasses[readerWidth]}`}>
            <article className={`rounded-2xl border p-5 shadow-sm sm:p-8 lg:p-12 ${activeTheme.border} ${activeTheme.surface}`}>
              <div className="mb-8 flex flex-col gap-3 border-b border-current/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.24em] ${activeTheme.muted}`}>Free Summary</p>
                  <h1 className={`mt-3 text-3xl font-bold tracking-normal ${activeTheme.text}`}>
                    {summary.subtitle || summary.title}
                  </h1>
                  <p className={`mt-2 text-sm ${activeTheme.muted}`}>by {summary.author}</p>
                </div>
                <div className={`text-sm font-semibold ${activeTheme.muted}`}>
                  {progress}% Completed
                </div>
              </div>

              <div
                className="font-serif text-left"
                style={{
                  fontSize: `clamp(18px, 1vw + 14px, ${fontSize}px)`,
                  lineHeight: lineHeights[lineSpacing],
                }}
              >
                {splitParagraphs(currentPage).map((paragraph, index) => (
                  <p key={index} className="mb-[22px]">
                    {index === 0 && paragraph ? (
                      <>
                        <span className="float-left mr-3 mt-2 text-7xl font-bold leading-[0.72] text-blue-600">
                          {paragraph.charAt(0)}
                        </span>
                        {paragraph.slice(1)}
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            </article>

            {searchOpen && searchQuery.trim() && (
              <div className={`mt-4 rounded-2xl border p-4 ${activeTheme.border} ${activeTheme.surface}`}>
                <p className={`text-sm font-semibold ${activeTheme.text}`}>
                  {searchMatches.length ? `${searchMatches.length} page result(s)` : 'No results found'}
                </p>
                <div className="mt-3 space-y-2">
                  {searchMatches.slice(0, 5).map((match) => (
                    <button
                      key={match.index}
                      type="button"
                      onClick={() => goToPage(match.index)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${activeTheme.control}`}
                    >
                      <span>Page {match.index + 1}</span>
                      <span>{match.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => goToPage(page - 1)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${activeTheme.control}`}
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Previous Page
              </button>

              <div className="flex flex-1 items-center gap-3 px-2">
                <div className={`h-2 flex-1 overflow-hidden rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-blue-100'}`}>
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className={`text-xs font-bold ${activeTheme.muted}`}>{progress}%</span>
              </div>

              <button
                type="button"
                disabled={page >= pages.length - 1}
                onClick={() => goToPage(page + 1)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${activeTheme.control}`}
              >
                Next Page
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <aside className={`sticky top-[84px] hidden h-fit rounded-2xl border p-3 lg:block ${activeTheme.border} ${activeTheme.surface}`}>
          <div className="space-y-2">
            <button type="button" onClick={toggleBookmark} className={`flex w-full flex-col items-center gap-1 rounded-xl p-3 text-xs font-semibold ${isBookmarked ? activeTheme.active : activeTheme.control}`}>
              {isBookmarked ? <BookmarkSolidIcon className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
              Save
            </button>
            <button type="button" onClick={() => setSearchOpen((value) => !value)} className={`flex w-full flex-col items-center gap-1 rounded-xl p-3 text-xs font-semibold ${activeTheme.control}`}>
              <MagnifyingGlassIcon className="h-5 w-5" />
              Search
            </button>
            <button type="button" onClick={() => setSettingsOpen(true)} className={`flex w-full flex-col items-center gap-1 rounded-xl p-3 text-xs font-semibold ${activeTheme.control}`}>
              Aa
              <span>Settings</span>
            </button>
          </div>
        </aside>
      </main>

      {moreOpen && (
        <div className={`fixed right-4 top-20 z-50 w-56 rounded-2xl border p-3 shadow-xl ${activeTheme.border} ${activeTheme.surface}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${activeTheme.muted}`}>Summary Reader</p>
          <p className={`mt-2 text-sm ${activeTheme.muted}`}>Free access</p>
        </div>
      )}

      <nav className={`fixed inset-x-0 bottom-0 z-40 border-t px-4 py-2 md:hidden ${activeTheme.border} ${activeTheme.surface}`}>
        <div className="grid grid-cols-4 gap-2">
          <button type="button" onClick={() => setTocOpen(true)} className={`rounded-xl py-2 text-xs font-semibold ${activeTheme.control}`}>
            <Bars3BottomLeftIcon className="mx-auto h-5 w-5" />
            Contents
          </button>
          <button type="button" onClick={() => setSettingsOpen(true)} className={`rounded-xl py-2 text-xs font-semibold ${activeTheme.control}`}>
            <span className="block text-base font-bold leading-5">Aa</span>
            Settings
          </button>
          <button type="button" onClick={toggleBookmark} className={`rounded-xl py-2 text-xs font-semibold ${isBookmarked ? activeTheme.active : activeTheme.control}`}>
            {isBookmarked ? <BookmarkSolidIcon className="mx-auto h-5 w-5" /> : <BookmarkIcon className="mx-auto h-5 w-5" />}
            Bookmark
          </button>
          <button type="button" className={`rounded-xl py-2 text-xs font-semibold ${activeTheme.control}`}>
            <span className="block text-base font-bold leading-5">{progress}%</span>
            Progress
          </button>
        </div>
      </nav>
    </div>
  );
}
