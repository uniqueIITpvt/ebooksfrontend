'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownTrayIcon,
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
import { booksApi, type BookFile } from '@/services/api/booksApi';

const WORDS_PER_PAGE = 520;
const READER_PROGRESS_PREFIX = 'techuniqueiit:free-summary-reader';

type ReaderTheme = 'light' | 'sepia' | 'dark';
type ReaderWidth = 'narrow' | 'standard' | 'wide';
type LineSpacing = 'compact' | 'normal' | 'relaxed';

type ReaderSummary = FreeSummary & {
  files?: {
    ebook?: BookFile | null;
  };
};

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
  fontName?: string;
};

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
    shell: 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50',
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

function decodeHtmlEntities(value: string) {
  if (typeof window === 'undefined') return value;

  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

function htmlToText(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(p|div|h[1-6]|li|section|article|br)>/gi, '\n\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()
  );
}

function extractFooterNumber(lines: string[]) {
  const cleanedLines = lines.map((line) => line.trim()).filter(Boolean);
  const lastLine = cleanedLines.at(-1);

  if (!lastLine || !/^\d+$/.test(lastLine)) {
    return { body: cleanedLines.join('\n'), footer: '' };
  }

  return {
    body: cleanedLines.slice(0, -1).join('\n'),
    footer: lastLine,
  };
}

function pdfItemsToLines(items: PdfTextItem[]) {
  const rows = new Map<number, PdfTextItem[]>();

  items
    .filter((item) => item.str?.trim())
    .forEach((item) => {
      const y = Math.round(item.transform?.[5] || 0);
      const nearbyKey = Array.from(rows.keys()).find((key) => Math.abs(key - y) <= 3);
      const key = nearbyKey ?? y;
      rows.set(key, [...(rows.get(key) || []), item]);
    });

  return Array.from(rows.entries())
    .sort(([a], [b]) => b - a)
    .map(([, rowItems]) =>
      rowItems
        .sort((a, b) => (a.transform?.[4] || 0) - (b.transform?.[4] || 0))
        .map((item) => item.str?.trim() || '')
        .filter(Boolean)
        .join(' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
    )
    .filter(Boolean);
}

export default function PagedReadClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<ReaderSummary | null>(null);
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
  const [fileTextPages, setFileTextPages] = useState<string[]>([]);
  const [filePageFooters, setFilePageFooters] = useState<string[]>([]);
  const [pdfPageVisuals, setPdfPageVisuals] = useState<string[]>([]);
  const [fileTextLoading, setFileTextLoading] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadSummary = async () => {
      try {
        let data: ReaderSummary | null = null;
        try {
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
            files: response.data.files,
          };
        } catch {
          data = await freeSummariesApi.getReadPayload(slug);
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

  const ebookFile = summary?.files?.ebook || null;
  const ebookUrl = ebookFile?.url || '';
  const ebookName = (ebookFile?.originalName || ebookUrl).toLowerCase();
  const isPdf = Boolean(ebookUrl) && (ebookFile?.mimeType === 'application/pdf' || ebookName.includes('.pdf'));
  const isTextFile = Boolean(ebookUrl) && (ebookFile?.mimeType?.startsWith('text/') || ebookName.includes('.txt'));
  const isEpub = Boolean(ebookUrl) && (ebookFile?.mimeType === 'application/epub+zip' || ebookName.includes('.epub'));
  const canExtractFileText = isPdf || isTextFile || isEpub;
  const hasExternalFile = Boolean(ebookUrl) && !canExtractFileText;
  const pages = useMemo(
    () => (fileTextPages.length ? fileTextPages : chunkWords(summary?.description || '')),
    [fileTextPages, summary]
  );
  const totalPages = isPdf ? Math.max(pdfPageCount, fileTextPages.length, summary?.pages || 1) : pages.length;
  const pageIndexes = useMemo(
    () => Array.from({ length: Math.max(totalPages, 1) }, (_, index) => index),
    [totalPages]
  );
  const currentPage = pages[page] || '';
  const currentPageFooter = filePageFooters[page] || '';
  const currentPageVisual = pdfPageVisuals[page] || '';
  const progress = Math.round(((page + 1) / Math.max(totalPages, 1)) * 100);
  const activeTheme = themeClasses[theme];
  const isBookmarked = bookmarkedPages.includes(page);
  const pdfWidthPercent = {
    narrow: 86,
    standard: 100,
    wide: 114,
  }[readerWidth] * (fontSize / 19);
  const pdfPagePadding = {
    compact: '0px',
    normal: '10px',
    relaxed: '20px',
  }[lineSpacing];

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
    if (!ebookUrl || !canExtractFileText) {
      setFileTextPages([]);
      setFilePageFooters([]);
      setPdfPageVisuals([]);
      setPdfPageCount(0);
      setFileTextLoading(false);
      return;
    }

    let ignore = false;

    const loadFileText = async () => {
      setFileTextLoading(true);
      setFileTextPages([]);
      setFilePageFooters([]);
      setPdfPageVisuals([]);
      setPdfPageCount(0);

      try {
        const response = await fetch(ebookUrl);
        if (!response.ok) {
          throw new Error('Unable to load uploaded file');
        }

        const buffer = await response.arrayBuffer();
        let extractedPages: string[] = [];

        if (isPdf) {
          const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/legacy/build/pdf.worker.mjs',
            import.meta.url
          ).toString();
          const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
          const extractedFooters: string[] = [];
          const pageVisuals: string[] = [];

          if (!ignore) {
            setPdfPageCount(pdf.numPages);
            setFileTextLoading(false);
          }

          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const pdfPage = await pdf.getPage(pageNumber);
            const textContent = await pdfPage.getTextContent();
            const lines = pdfItemsToLines(textContent.items as PdfTextItem[]);
            const { body, footer } = extractFooterNumber(lines);
            const viewport = pdfPage.getViewport({ scale: 2.6 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);

            if (context) {
              await pdfPage.render({ canvasContext: context, viewport }).promise;
              pageVisuals.push(canvas.toDataURL('image/png'));
            } else {
              pageVisuals.push('');
            }

            extractedPages.push(body || `Page ${pageNumber}`);
            extractedFooters.push(footer);
          }

          if (!ignore) setFilePageFooters(extractedFooters);
          if (!ignore) setPdfPageVisuals(pageVisuals);
        } else if (isTextFile) {
          extractedPages = chunkWords(new TextDecoder('utf-8').decode(buffer));
        } else if (isEpub) {
          const JSZip = (await import('jszip')).default;
          const zip = await JSZip.loadAsync(buffer);
          const entries = Object.values(zip.files)
            .filter((file) => !file.dir && /\.(xhtml|html|htm)$/i.test(file.name))
            .sort((a, b) => a.name.localeCompare(b.name));
          const textParts: string[] = [];

          for (const entry of entries) {
            const html = await entry.async('text');
            const text = htmlToText(html);
            if (text) textParts.push(text);
          }

          extractedPages = chunkWords(textParts.join('\n\n'));
        }

        if (!ignore) {
          setFileTextPages(extractedPages.length ? extractedPages : chunkWords(summary?.description || ''));
        }
      } catch {
        if (!ignore) {
          setFileTextPages(chunkWords(summary?.description || ''));
          setFilePageFooters([]);
          setPdfPageVisuals([]);
        }
      } finally {
        if (!ignore) {
          setFileTextLoading(false);
        }
      }
    };

    loadFileText();

    return () => {
      ignore = true;
    };
  }, [canExtractFileText, ebookUrl, isEpub, isPdf, isTextFile, summary?.description]);

  useEffect(() => {
    try {
      const rawProgress = localStorage.getItem(`${READER_PROGRESS_PREFIX}:${slug}`);
      const rawBookmarks = localStorage.getItem(`${READER_PROGRESS_PREFIX}:bookmarks:${slug}`);

      if (rawProgress) {
        const saved = JSON.parse(rawProgress) as { page?: number };
        if (Number.isInteger(saved.page)) {
          setPage(Math.min(Math.max(saved.page || 0, 0), Math.max(totalPages - 1, 0)));
        }
      }

      if (rawBookmarks) {
        const savedBookmarks = JSON.parse(rawBookmarks);
        if (Array.isArray(savedBookmarks)) {
          setBookmarkedPages(savedBookmarks.filter((item) => Number.isInteger(item)));
        }
      }
    } catch {}
  }, [slug, totalPages]);

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
    setPage(Math.min(Math.max(nextPage, 0), Math.max(totalPages - 1, 0)));
    setTocOpen(false);
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
    <div className={`h-screen overflow-hidden ${activeTheme.shell} ${activeTheme.text}`}>
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
              {summary.subtitle || summary.category} - Page {page + 1} of {totalPages}
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
              {pageIndexes.map((index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToPage(index)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
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

      <main className="mx-auto grid h-[calc(100vh-64px)] max-w-[1440px] gap-5 overflow-hidden px-0 py-4 md:px-5 lg:grid-cols-[240px_minmax(0,1fr)_96px]">
        <aside className={`hidden h-full min-h-0 overflow-hidden rounded-2xl border p-3 lg:block ${activeTheme.border} ${activeTheme.surface}`}>
          <p className={`px-1 text-[11px] font-bold uppercase tracking-[0.2em] ${activeTheme.muted}`}>Contents</p>
          <nav className="mt-3 h-[calc(100%-28px)] space-y-1 overflow-y-auto pr-1">
            {pageIndexes.map((index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToPage(index)}
                className={`w-full rounded-lg px-3 py-1.5 text-left text-xs font-semibold transition ${
                  page === index ? activeTheme.active : activeTheme.control
                }`}
              >
                Page {index + 1}
                <span className={`block text-[10px] leading-4 ${page === index ? 'text-white/75' : activeTheme.muted}`}>
                  Section
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-h-0 min-w-0 overflow-hidden px-5 md:px-0">
          <div className={`mx-auto flex h-full min-h-0 flex-col ${widthClasses[readerWidth]}`}>
            <article className={`flex min-h-0 flex-1 flex-col rounded-2xl border p-4 shadow-sm sm:p-5 lg:p-6 ${activeTheme.border} ${activeTheme.surface}`}>
              <div className="mb-4 flex shrink-0 flex-col gap-3 border-b border-current/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.24em] ${activeTheme.muted}`}>Free Summary</p>
                  <h1 className={`mt-2 text-2xl font-bold tracking-normal ${activeTheme.text}`}>
                    {summary.subtitle || summary.title}
                  </h1>
                  <p className={`mt-2 text-sm ${activeTheme.muted}`}>by {summary.author}</p>
                </div>
                <div className={`text-sm font-semibold ${activeTheme.muted}`}>
                  {progress}% Completed
                </div>
              </div>

              {fileTextLoading ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50/50 px-6 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                  <p className={`mt-4 text-sm font-semibold ${activeTheme.muted}`}>
                    {isPdf ? 'Opening PDF page...' : 'Preparing reader text...'}
                  </p>
                </div>
              ) : hasExternalFile ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50/50 px-6 text-center">
                  <p className="max-w-md text-sm text-slate-600">
                    This uploaded summary file cannot be previewed directly in the browser.
                  </p>
                  <a
                    href={ebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Open Uploaded File
                  </a>
                </div>
              ) : (
                <div
                  className="flex min-h-0 flex-1 flex-col overflow-hidden font-serif text-left"
                  style={{
                    fontSize: `clamp(18px, 1vw + 14px, ${fontSize}px)`,
                    lineHeight: lineHeights[lineSpacing],
                  }}
                >
                  <div
                    className={`min-h-0 flex-1 break-normal ${isPdf ? 'overflow-auto' : 'overflow-hidden'}`}
                    style={isPdf ? { padding: pdfPagePadding } : undefined}
                  >
                    {isPdf && currentPageVisual ? (
                      <img
                        src={currentPageVisual}
                        alt={`${summary.title} page ${page + 1}`}
                        className="mx-auto block h-auto max-w-none"
                        style={{ width: `${pdfWidthPercent}%` }}
                      />
                    ) : (
                      splitParagraphs(currentPage).map((paragraph, index) => (
                        <p key={index} className="mb-[22px] whitespace-normal break-normal">
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
                      ))
                    )}
                  </div>
                  {currentPageFooter && !isPdf ? (
                    <div className={`shrink-0 pt-3 text-center text-sm font-semibold ${activeTheme.muted}`}>
                      {currentPageFooter}
                    </div>
                  ) : null}
                </div>
              )}
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

            <div className="mt-2 flex shrink-0 items-center gap-2 pb-16 md:mt-3 md:gap-3 md:pb-0">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => goToPage(page - 1)}
                className={`inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm md:h-auto md:flex-none md:gap-2 md:px-5 md:py-3 ${activeTheme.control}`}
              >
                <ArrowLeftIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">Previous Page</span>
              </button>

              <div className="flex min-w-0 flex-[1.15] items-center gap-2 px-1 md:flex-1 md:gap-3 md:px-2">
                <div className={`h-2 flex-1 overflow-hidden rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-blue-100'}`}>
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className={`text-xs font-bold ${activeTheme.muted}`}>{progress}%</span>
              </div>

              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => goToPage(page + 1)}
                className={`inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm md:h-auto md:flex-none md:gap-2 md:px-5 md:py-3 ${activeTheme.control}`}
              >
                <span className="truncate">Next Page</span>
                <ArrowRightIcon className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>
        </section>

        <aside className={`hidden h-fit rounded-2xl border p-3 lg:block ${activeTheme.border} ${activeTheme.surface}`}>
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
