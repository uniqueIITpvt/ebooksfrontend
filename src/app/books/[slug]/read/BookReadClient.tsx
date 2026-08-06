'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsPointingOutIcon,
  Bars3BottomLeftIcon,
  BookmarkIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { booksApi, type AudiobookReaderPage, type Book } from '@/services/api/booksApi';

const WORDS_PER_CHAPTER = 700;
const DEFAULT_FONT_SIZE = 19;
const MOBILE_FONT_SIZE = 18;

type ReaderTheme = 'light' | 'sepia' | 'dark';
type LineSpacing = 'compact' | 'normal' | 'relaxed';
type PageWidth = 'narrow' | 'standard' | 'wide';
type ReadingMode = 'scroll' | 'page';
type ReaderFont = 'Literata' | 'Lora' | 'Merriweather';

interface ReaderChapter {
  id: string;
  title: string;
  content: string;
  pageNumber?: number;
}

interface SavedReaderProgress {
  chapterIndex: number;
  pdfPage: number;
  scrollY: number;
  completed: number;
  updatedAt: string;
}

const THEME_CLASSES: Record<
  ReaderTheme,
  {
    shell: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    control: string;
    active: string;
  }
> = {
  light: {
    shell: 'bg-gradient-to-r from-blue-50 via-indigo-50 to-white',
    surface: 'bg-white',
    text: 'text-slate-950',
    muted: 'text-slate-500',
    border: 'border-slate-200',
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

const FONT_CLASSES: Record<ReaderFont, string> = {
  Literata: 'font-serif',
  Lora: 'font-serif',
  Merriweather: 'font-serif',
};

const LINE_HEIGHTS: Record<LineSpacing, string> = {
  compact: '1.55',
  normal: '1.8',
  relaxed: '2.05',
};

const PAGE_WIDTHS: Record<PageWidth, string> = {
  narrow: 'max-w-[640px]',
  standard: 'max-w-[760px]',
  wide: 'max-w-[900px]',
};

function getPdfPageCount(buffer: ArrayBuffer) {
  const text = new TextDecoder('latin1').decode(buffer);
  const pageMatches = text.match(/\/Type\s*\/Page\b/g);
  const pagesTreeCounts = Array.from(text.matchAll(/\/Type\s*\/Pages[\s\S]{0,300}?\/Count\s+(\d+)/g))
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);
  const maxPagesTreeCount = pagesTreeCounts.length ? Math.max(...pagesTreeCounts) : 0;

  return Math.max(pageMatches?.length || 0, maxPagesTreeCount, 1);
}

function chunkWords(text: string, wordsPerChunk = WORDS_PER_CHAPTER) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }

  return chunks.length ? chunks : [''];
}

function splitParagraphs(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.length ? paragraphs : [text.trim()].filter(Boolean);
}

function buildChapters(book: Book | null): ReaderChapter[] {
  if (!book) return [];

  if (book.readerPages?.length) {
    return book.readerPages.map((page: AudiobookReaderPage, index) => ({
      id: `reader-page-${page.pageNumber || index + 1}`,
      title: page.title || `Chapter ${String(index + 1).padStart(2, '0')}`,
      content: page.content || '',
      pageNumber: page.pageNumber,
    }));
  }

  return chunkWords(book.description || '').map((content, index) => ({
    id: `chapter-${index + 1}`,
    title: index === 0 ? 'Opening Chapter' : `Chapter ${String(index + 1).padStart(2, '0')}`,
    content,
  }));
}

function getProgressKey(slug: string) {
  return `techuniqueiit:ebook-reader:${slug}`;
}

function getBookmarkKey(slug: string) {
  return `techuniqueiit:ebook-bookmarks:${slug}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function BookReadClient({ slug }: { slug: string }) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [readerError, setReaderError] = useState('');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [pdfPreviewError, setPdfPreviewError] = useState('');
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfPageChanging, setPdfPageChanging] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(1);
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [fontFamily, setFontFamily] = useState<ReaderFont>('Literata');
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>('normal');
  const [pageWidth, setPageWidth] = useState<PageWidth>('standard');
  const [readingMode, setReadingMode] = useState<ReadingMode>('scroll');
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [savedProgress, setSavedProgress] = useState<SavedReaderProgress | null>(null);

  const themeClasses = THEME_CLASSES[theme];

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

        setReaderError(message || 'Unable to open this ebook right now.');
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
  const chapters = useMemo(() => buildChapters(book), [book]);
  const currentChapter = chapters[chapterIndex] || chapters[0];
  const chapterTitle = currentChapter?.title || 'Reader';
  const shortTitle = book?.title || 'Ebook Reader';
  const progressPercent = useMemo(() => {
    if (isPdf) {
      return Math.round((pdfPage / Math.max(pdfPageCount, 1)) * 100);
    }

    return Math.round(((chapterIndex + 1) / Math.max(chapters.length, 1)) * 100);
  }, [chapterIndex, chapters.length, isPdf, pdfPage, pdfPageCount]);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();

    return chapters
      .map((chapter, index) => ({
        index,
        title: chapter.title,
        count: (chapter.content.toLowerCase().match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length,
      }))
      .filter((result) => result.count > 0);
  }, [chapters, searchQuery]);

  const accessLabel = useMemo(() => {
    if (book?.access?.accessMode === 'purchase' || book?.access?.owned) return 'Lifetime Access';
    if (book?.accessLevel === 'premium' || book?.access?.accessMode === 'claim') return 'Included with Premium';
    return 'Lifetime Access';
  }, [book?.access?.accessMode, book?.access?.owned, book?.accessLevel]);

  useEffect(() => {
    if (!book) return;

    try {
      const rawProgress = localStorage.getItem(getProgressKey(slug));
      const rawBookmarks = localStorage.getItem(getBookmarkKey(slug));

      if (rawProgress) {
        const parsed = JSON.parse(rawProgress) as SavedReaderProgress;
        setSavedProgress(parsed);
        setChapterIndex(clamp(parsed.chapterIndex || 0, 0, Math.max(chapters.length - 1, 0)));
        setPdfPage(clamp(parsed.pdfPage || 1, 1, Math.max(pdfPageCount, 1)));

        window.requestAnimationFrame(() => {
          window.scrollTo({ top: parsed.scrollY || 0 });
        });
      }

      if (rawBookmarks) {
        const parsedBookmarks = JSON.parse(rawBookmarks);
        if (Array.isArray(parsedBookmarks)) {
          setBookmarks(parsedBookmarks.filter((value) => Number.isInteger(value)));
        }
      }
    } catch {
      setSavedProgress(null);
      setBookmarks([]);
    }
  }, [book, chapters.length, pdfPageCount, slug]);

  useEffect(() => {
    if (!book) return;

    const saveProgress = () => {
      const payload: SavedReaderProgress = {
        chapterIndex,
        pdfPage,
        scrollY: window.scrollY,
        completed: progressPercent,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(getProgressKey(slug), JSON.stringify(payload));
      setSavedProgress(payload);
    };

    const timer = window.setTimeout(saveProgress, 250);
    window.addEventListener('beforeunload', saveProgress);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeunload', saveProgress);
    };
  }, [book, chapterIndex, pdfPage, progressPercent, slug]);

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

  const scrollToReaderTop = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToChapter = useCallback(
    (nextIndex: number) => {
      setChapterIndex(clamp(nextIndex, 0, Math.max(chapters.length - 1, 0)));
      setTocOpen(false);
      window.requestAnimationFrame(scrollToReaderTop);
    },
    [chapters.length]
  );

  const goToPdfPage = (nextPage: number) => {
    if (!isPdf || !pdfPreviewUrl) return;

    const boundedPage = clamp(nextPage, 1, pdfPageCount);
    if (boundedPage === pdfPage) return;

    setPdfPageChanging(true);
    setPdfPage(boundedPage);
  };

  const toggleBookmark = () => {
    const target = isPdf ? pdfPage : chapterIndex;
    setBookmarks((current) => {
      const next = current.includes(target)
        ? current.filter((item) => item !== target)
        : [...current, target].sort((a, b) => a - b);

      localStorage.setItem(getBookmarkKey(slug), JSON.stringify(next));
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

  const isBookmarked = bookmarks.includes(isPdf ? pdfPage : chapterIndex);
  const canGoPrevious = isPdf ? pdfPage > 1 : chapterIndex > 0;
  const canGoNext = isPdf ? pdfPage < pdfPageCount : chapterIndex < chapters.length - 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-50 via-indigo-50 to-white px-5 py-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-14 rounded-2xl bg-white/80" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr_96px]">
            <div className="hidden h-[70vh] rounded-2xl bg-white/70 lg:block" />
            <div className="h-[78vh] rounded-2xl bg-white/85" />
            <div className="hidden h-[70vh] rounded-2xl bg-white/70 lg:block" />
          </div>
        </div>
      </div>
    );
  }

  if (readerError || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-50 via-indigo-50 to-white px-5">
        <div className="w-full max-w-lg rounded-2xl border border-blue-100 bg-white/90 p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">Reader unavailable</h1>
          <p className="mt-3 text-slate-600">
            {readerError || 'This ebook could not be opened right now.'}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => router.push('/profile?tab=library')}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to Library
            </button>
            <button
              type="button"
              onClick={() => router.push('/subscription')}
              className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Renew Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.shell} ${themeClasses.text}`}>
      <header className={`sticky top-0 z-40 border-b ${themeClasses.border} ${themeClasses.surface}/95 backdrop-blur-xl`}>
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-3 sm:px-5 lg:px-8">
          <button
            type="button"
            onClick={() => router.push('/profile?tab=library')}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${themeClasses.control}`}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Back to Library</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="min-w-0 flex-1 px-2 text-center sm:text-left">
            <p className={`truncate text-sm font-bold ${themeClasses.text}`}>{shortTitle}</p>
            <p className={`truncate text-xs ${themeClasses.muted}`}>
              {chapterTitle}
              {savedProgress ? ` · ${savedProgress.completed}% completed` : ''}
            </p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {searchOpen && (
              <div className={`flex h-10 items-center gap-2 rounded-xl border px-3 ${themeClasses.border} ${themeClasses.surface}`}>
                <MagnifyingGlassIcon className={`h-4 w-4 ${themeClasses.muted}`} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search book"
                  className={`w-44 bg-transparent text-sm outline-none placeholder:text-slate-400 ${themeClasses.text}`}
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen((value) => !value)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${themeClasses.control}`}
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen((value) => !value)}
              className={`flex h-10 items-center justify-center rounded-xl px-3 text-sm font-bold ${themeClasses.control}`}
              aria-label="Reading settings"
            >
              Aa
            </button>
            <button
              type="button"
              onClick={toggleBookmark}
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${isBookmarked ? themeClasses.active : themeClasses.control}`}
              aria-label="Bookmark"
            >
              {isBookmarked ? <BookmarkSolidIcon className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={openFullscreen}
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${themeClasses.control}`}
              aria-label="Fullscreen"
            >
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((value) => !value)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${themeClasses.control}`}
                aria-label="More options"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
              {moreOpen && (
                <div className={`absolute right-0 top-12 w-56 rounded-2xl border p-2 shadow-xl ${themeClasses.border} ${themeClasses.surface}`}>
                  <p className={`px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${themeClasses.muted}`}>
                    {accessLabel}
                  </p>
                  {ebookUrl && (
                    <a
                      href={ebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${themeClasses.control}`}
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Open ebook file
                    </a>
                  )}
                </div>
              )}
            </div>
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
              <p className="text-sm font-semibold text-slate-700">Font family</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['Literata', 'Lora', 'Merriweather'] as ReaderFont[]).map((font) => (
                  <button
                    key={font}
                    type="button"
                    onClick={() => setFontFamily(font)}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold ${
                      fontFamily === font ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

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
                {(['narrow', 'standard', 'wide'] as PageWidth[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPageWidth(item)}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold capitalize ${
                      pageWidth === item ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">Reading mode</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(['scroll', 'page'] as ReadingMode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setReadingMode(item)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold capitalize ${
                      readingMode === item ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {item} mode
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-[1440px] gap-5 px-0 pb-24 pt-5 md:px-5 lg:grid-cols-[260px_minmax(0,1fr)_96px] lg:pb-10 lg:pt-6">
        <aside className={`sticky top-[84px] hidden h-[calc(100vh-96px)] rounded-2xl border p-4 lg:block ${themeClasses.border} ${themeClasses.surface}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.22em] ${themeClasses.muted}`}>Contents</p>
          <nav className="mt-4 space-y-1 overflow-y-auto pr-1">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => goToChapter(index)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  chapterIndex === index ? themeClasses.active : themeClasses.control
                }`}
              >
                <span className="block truncate">{chapter.title}</span>
                <span className={`block text-xs ${chapterIndex === index ? 'text-white/75' : themeClasses.muted}`}>
                  {index === 0 ? 'Introduction' : `Section ${index + 1}`}
                </span>
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setNotesOpen((value) => !value)}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold ${themeClasses.control}`}
          >
            <BookmarkIcon className="h-4 w-4" />
            Bookmarks
          </button>
        </aside>

        <section ref={contentRef} className="min-w-0 px-5 md:px-0">
          <div className={`mx-auto ${PAGE_WIDTHS[pageWidth]}`}>
            <div className={`rounded-2xl border p-5 shadow-sm sm:p-8 lg:p-12 ${themeClasses.border} ${themeClasses.surface}`}>
              <div className="mb-8 flex flex-col gap-3 border-b border-current/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.24em] ${themeClasses.muted}`}>
                    {accessLabel}
                  </p>
                  <h1 className={`mt-3 text-3xl font-bold tracking-normal ${themeClasses.text}`}>
                    {chapterTitle}
                  </h1>
                </div>
                <div className={`text-sm font-semibold ${themeClasses.muted}`}>
                  {progressPercent}% Completed
                </div>
              </div>

              {isPdf && ebookUrl ? (
                <div className="min-h-[72vh]">
                  {pdfPreviewLoading ? (
                    <div className="flex min-h-[60vh] items-center justify-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                    </div>
                  ) : pdfPreviewUrl ? (
                    <div className={`relative mx-auto aspect-[210/297] w-full max-w-[760px] overflow-hidden rounded-xl border ${themeClasses.border}`}>
                      <iframe
                        key={`pdf-page-${pdfPage}`}
                        title={`${book.title} page ${pdfPage}`}
                        src={getPdfViewerUrl(pdfPage)}
                        scrolling="no"
                        onLoad={() => setPdfPageChanging(false)}
                        className="pointer-events-none h-full w-full border-0 bg-white"
                      />
                      {pdfPageChanging ? <div className={`absolute inset-0 ${themeClasses.surface}`} /> : null}
                    </div>
                  ) : (
                    <div className="flex min-h-[55vh] flex-col items-center justify-center px-8 text-center">
                      <p className={`max-w-md ${themeClasses.muted}`}>
                        {pdfPreviewError || 'This PDF could not be previewed in the browser.'}
                      </p>
                      <a
                        href={ebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Open PDF File
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <article
                  className={`${FONT_CLASSES[fontFamily]} text-left`}
                  style={{
                    fontSize: `clamp(${MOBILE_FONT_SIZE}px, 1vw + 14px, ${fontSize}px)`,
                    lineHeight: LINE_HEIGHTS[lineSpacing],
                  }}
                >
                  {splitParagraphs(currentChapter?.content || '').map((paragraph, index) => (
                    <p key={`${currentChapter?.id}-${index}`} className="mb-[22px]">
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
                </article>
              )}
            </div>

            {searchOpen && searchQuery.trim() && (
              <div className={`mt-4 rounded-2xl border p-4 ${themeClasses.border} ${themeClasses.surface}`}>
                <p className={`text-sm font-semibold ${themeClasses.text}`}>
                  {searchMatches.length ? `${searchMatches.length} chapter result(s)` : 'No results found'}
                </p>
                <div className="mt-3 space-y-2">
                  {searchMatches.slice(0, 5).map((match) => (
                    <button
                      key={match.index}
                      type="button"
                      onClick={() => goToChapter(match.index)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${themeClasses.control}`}
                    >
                      <span>{match.title}</span>
                      <span>{match.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={() => (isPdf ? goToPdfPage(pdfPage - 1) : goToChapter(chapterIndex - 1))}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${themeClasses.control}`}
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Previous Chapter
              </button>

              <div className="flex flex-1 items-center gap-3 px-2">
                <div className={`h-2 flex-1 overflow-hidden rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-blue-100'}`}>
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className={`text-xs font-bold ${themeClasses.muted}`}>{progressPercent}%</span>
              </div>

              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => (isPdf ? goToPdfPage(pdfPage + 1) : goToChapter(chapterIndex + 1))}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${themeClasses.control}`}
              >
                Next Chapter
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <aside className={`sticky top-[84px] hidden h-fit rounded-2xl border p-3 lg:block ${themeClasses.border} ${themeClasses.surface}`}>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setNotesOpen((value) => !value)}
              className={`flex w-full flex-col items-center gap-1 rounded-xl p-3 text-xs font-semibold ${notesOpen ? themeClasses.active : themeClasses.control}`}
            >
              <BookmarkIcon className="h-5 w-5" />
              Notes
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen((value) => !value)}
              className={`flex w-full flex-col items-center gap-1 rounded-xl p-3 text-xs font-semibold ${themeClasses.control}`}
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              Search
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className={`flex w-full flex-col items-center gap-1 rounded-xl p-3 text-xs font-semibold ${themeClasses.control}`}
            >
              Aa
              <span>Settings</span>
            </button>
          </div>
        </aside>
      </main>

      {notesOpen && (
        <div className={`fixed bottom-20 right-4 z-40 max-h-[70vh] w-[min(360px,calc(100vw-32px))] overflow-y-auto rounded-2xl border p-4 shadow-2xl lg:bottom-6 ${themeClasses.border} ${themeClasses.surface}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Bookmarks & Notes</h2>
            <button type="button" onClick={() => setNotesOpen(false)} className={`rounded-full p-1 ${themeClasses.control}`}>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {bookmarks.length ? (
              bookmarks.map((bookmark) => (
                <button
                  key={bookmark}
                  type="button"
                  onClick={() => (isPdf ? goToPdfPage(bookmark) : goToChapter(bookmark))}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${themeClasses.control}`}
                >
                  <span>{isPdf ? `Page ${bookmark}` : chapters[bookmark]?.title || `Chapter ${bookmark + 1}`}</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              ))
            ) : (
              <p className={`text-sm ${themeClasses.muted}`}>No bookmarks yet.</p>
            )}
          </div>
        </div>
      )}

      {tocOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden">
          <div className={`h-full w-[min(340px,86vw)] overflow-y-auto border-r p-5 ${themeClasses.border} ${themeClasses.surface}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Contents</h2>
              <button type="button" onClick={() => setTocOpen(false)} className={`rounded-full p-1 ${themeClasses.control}`}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => goToChapter(index)}
                  className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${
                    chapterIndex === index ? themeClasses.active : themeClasses.control
                  }`}
                >
                  {chapter.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className={`fixed inset-x-0 bottom-0 z-40 border-t px-4 py-2 md:hidden ${themeClasses.border} ${themeClasses.surface}`}>
        <div className="grid grid-cols-4 gap-2">
          <button type="button" onClick={() => setTocOpen(true)} className={`rounded-xl py-2 text-xs font-semibold ${themeClasses.control}`}>
            <Bars3BottomLeftIcon className="mx-auto h-5 w-5" />
            Contents
          </button>
          <button type="button" onClick={() => setSettingsOpen(true)} className={`rounded-xl py-2 text-xs font-semibold ${themeClasses.control}`}>
            <span className="block text-base font-bold leading-5">Aa</span>
            Settings
          </button>
          <button type="button" onClick={toggleBookmark} className={`rounded-xl py-2 text-xs font-semibold ${isBookmarked ? themeClasses.active : themeClasses.control}`}>
            {isBookmarked ? <BookmarkSolidIcon className="mx-auto h-5 w-5" /> : <BookmarkIcon className="mx-auto h-5 w-5" />}
            Bookmark
          </button>
          <button type="button" className={`rounded-xl py-2 text-xs font-semibold ${themeClasses.control}`}>
            <ChevronDownIcon className="mx-auto h-5 w-5 rotate-180" />
            {progressPercent}%
          </button>
        </div>
      </nav>
    </div>
  );
}
