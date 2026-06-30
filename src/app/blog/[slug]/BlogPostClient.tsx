'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  TagIcon,
  ArrowLeftIcon,
  ShareIcon,
  HeartIcon,
  BookmarkIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';
import { blogsApi } from '@/services/api/blogsApi';
import type { BlogPost } from '@/lib/server/public-data';

interface BlogPostClientProps {
  post: BlogPost;
}

export default function BlogPostClient({ post }: BlogPostClientProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const blogIdentifier = post.slug || post._id;

  const articleTags = useMemo(() => {
    if (Array.isArray(post.tags)) {
      return post.tags;
    }

    if (typeof post.tags === 'string') {
      return post.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    return [];
  }, [post.tags]);

  const formattedPublishDate = useMemo(() => {
    const parsedDate = new Date(post.publishDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return post.publishDate;
    }

    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [post.publishDate]);

  const authorName = post.author?.trim() || 'TechUniqueIIT Research Center';
  const authorInitials =
    authorName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? '')
      .join('') || 'TR';

  const containsHtml = (content: string) => /<\/?[a-z][\s\S]*>/i.test(content);

  const isPointHeading = (line: string) => {
    const trimmedLine = line.trim();
    const textWithoutPrefix = trimmedLine
      .replace(/^[^\p{L}\p{N}]+/u, '')
      .trim();
    const wordCount = textWithoutPrefix.split(/\s+/).filter(Boolean).length;

    if (!textWithoutPrefix || textWithoutPrefix.length > 95 || wordCount > 12) {
      return false;
    }

    if (/^\d+\.\s+\S+/.test(textWithoutPrefix)) {
      return true;
    }

    if (/[?:]$/.test(textWithoutPrefix)) {
      return true;
    }

    const hasSentenceEnding = /[.!]$/.test(textWithoutPrefix);
    const startsWithCapital = /^[A-Z0-9]/.test(textWithoutPrefix);
    const titleLikeWords = textWithoutPrefix
      .split(/\s+/)
      .filter((word) => /^[A-Z0-9]/.test(word) || word.length <= 3).length;

    return startsWithCapital && !hasSentenceEnding && titleLikeWords >= Math.max(2, Math.ceil(wordCount * 0.45));
  };

  const renderInlineText = (line: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${part}-${index}`} className="font-bold text-slate-950">
            {part.slice(2, -2)}
          </strong>
        );
      }

      return part;
    });
  };

  const stripHtmlForHeadingCheck = (html: string) =>
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

  const enhancedHtmlContent = useMemo(() => {
    if (!post.content || !containsHtml(post.content)) {
      return post.content;
    }

    const toPointHeading = (html: string) =>
      `<h2 class="blog-point-heading">${html.replace(/:\s*$/, '')}</h2>`;

    const enhanceTextBlock = (match: string, attrs: string, innerHtml: string, tagName = 'p') => {
      const lineParts = innerHtml
        .split(/(?:<br\s*\/?>|\r?\n)+/i)
        .map((part: string) => part.trim())
        .filter(Boolean);

      if (lineParts.length > 1) {
        return lineParts
          .map((part: string) => {
            const text = stripHtmlForHeadingCheck(part);

            if (isPointHeading(text)) {
              return toPointHeading(part);
            }

            return `<${tagName}${attrs}>${part}</${tagName}>`;
          })
          .join('');
      }

      const text = stripHtmlForHeadingCheck(innerHtml);

      if (!isPointHeading(text)) {
        return match;
      }

      return toPointHeading(innerHtml);
    };

    const enhancedParagraphs = post.content
      .replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, innerHtml) =>
        enhanceTextBlock(match, attrs, innerHtml, 'p')
      )
      .replace(/<div([^>]*)>([\s\S]*?)<\/div>/gi, (match, attrs, innerHtml) =>
        enhanceTextBlock(match, attrs, innerHtml, 'div')
      );

    return enhancedParagraphs.replace(
      /(^|(?:<br\s*\/?>|\r?\n))(\s*\d+\.\s+[^<\r\n]+)/gi,
      (_match, prefix, line) => `${prefix}${toPointHeading(line.trim())}`
    );
  }, [post.content]);

  const renderPlainArticleContent = (content: string) => {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return (
      <div className="space-y-4 blog-print-content">
        {lines.map((line, index) => {
          if (isPointHeading(line)) {
            return (
              <h2
                key={`${line}-${index}`}
                className="mt-8 rounded-xl border-l-4 border-[#0057b8] bg-gradient-to-r from-blue-50 via-cyan-50 to-orange-50 px-4 py-3 text-xl font-extrabold text-slate-950 shadow-sm"
              >
                {line.replace(/:$/, '')}
              </h2>
            );
          }

          return (
            <p
              key={`${line}-${index}`}
              className="text-lg leading-8 text-slate-700"
            >
              {renderInlineText(line)}
            </p>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const loadUserState = async () => {
      if (isLoading || !isAuthenticated || !blogIdentifier) {
        return;
      }

      try {
        const response = await blogsApi.getUserState(blogIdentifier);
        if (response.success && response.data) {
          setIsLiked(response.data.liked);
          setIsBookmarked(response.data.saved);
          setLikes(response.data.likes);
        }
      } catch {
        // Non-critical: keep the public blog readable if user-state fails.
      }
    };

    loadUserState();
  }, [blogIdentifier, isAuthenticated, isLoading]);

  const redirectToSignIn = () => {
    router.push(`/user/auth?mode=signin&returnUrl=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      redirectToSignIn();
      return;
    }

    if (isSavingAction) return;

    setIsSavingAction(true);
    try {
      const response = await blogsApi.toggleLike(blogIdentifier);
      if (response.success && response.data) {
        setIsLiked(response.data.liked);
        setLikes(response.data.likes);
      }
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      redirectToSignIn();
      return;
    }

    if (isSavingAction) return;

    setIsSavingAction(true);
    try {
      const response = await blogsApi.toggleSave(blogIdentifier);
      if (response.success && response.data) {
        setIsBookmarked(response.data.saved);
      }
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post.title;
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`);
        break;
    }
  };

  return (
    <div className="min-h-screen sm:pt-4 lg:pt-7 bg-white blog-print-page">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .blog-print-area,
          .blog-print-area * {
            visibility: visible !important;
          }

          .blog-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 18mm !important;
            color: #0f172a !important;
            background: #ffffff !important;
          }

          .blog-no-print {
            display: none !important;
          }

          .blog-print-header {
            display: flex !important;
          }

          .blog-print-area article {
            padding: 0 !important;
          }

          .blog-print-area h1 {
            font-size: 28px !important;
            line-height: 1.2 !important;
          }

          .blog-print-image {
            height: 180px !important;
            background: #ffffff !important;
            page-break-inside: avoid;
          }

          .blog-print-image img {
            object-fit: contain !important;
            object-position: center center !important;
          }

          .blog-print-content {
            page-break-inside: auto;
          }

          .blog-print-content h2 {
            border: 0 !important;
            border-left: 4px solid #0057b8 !important;
            background: #eff6ff !important;
            box-shadow: none !important;
          }
        }

        .blog-print-content .blog-point-heading {
          margin: 2rem 0 0.85rem !important;
          border-left: 5px solid #0057b8 !important;
          border-radius: 14px !important;
          background: linear-gradient(90deg, rgba(0, 87, 184, 0.12), rgba(0, 166, 214, 0.09), rgba(245, 130, 32, 0.12)) !important;
          padding: 0.85rem 1rem !important;
          color: #020617 !important;
          font-size: 1.35rem !important;
          line-height: 1.3 !important;
          font-weight: 900 !important;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08) !important;
        }
      `}</style>
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 blog-no-print">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-blue-500 hover:text-blue-700">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/blog" className="text-blue-500 hover:text-blue-700">
              Blog
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate">{post.title}</span>
          </nav>
        </div>
      </div>

      <main className="blog-print-area max-w-4xl mx-auto">
        <div className="blog-print-header hidden items-center justify-between border-b border-slate-200 pb-4 mb-8">
          <div className="flex items-center gap-3">
            <Image
              src="/file.svg"
              alt="TechUniqueIIT Research Center"
              width={72}
              height={72}
              className="object-contain"
            />
            <div>
              <p className="text-base font-bold text-slate-900">TechUniqueIIT Research Center</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Blog Article</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">{formattedPublishDate}</p>
        </div>

      <article className="px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Article Header */}
        <header className="mb-8 lg:mb-12">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm font-medium blog-no-print"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          {/* Category Badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              ['Book Summaries', 'Audiobooks'].includes(post.category)
                ? 'bg-blue-100 text-blue-800'
                : ['Self Development', 'Business'].includes(post.category)
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-teal-100 text-teal-800'
            }`}>
              <TagIcon className="w-4 h-4 mr-1" />
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-600 mb-6">
            <div className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2" />
              {post.author}
            </div>
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {formattedPublishDate}
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              {post.readTime}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mb-8 blog-no-print">
            <button
              onClick={handleLike}
              disabled={isSavingAction}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isLiked ? (
                <HeartSolidIcon className="w-5 h-5" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
              {likes}
            </button>

            <button
              onClick={handleBookmark}
              disabled={isSavingAction}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isBookmarked 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BookmarkIcon className="w-5 h-5" />
              {isBookmarked ? 'Saved' : 'Save'}
            </button>

            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <ShareIcon className="w-5 h-5" />
                Share
              </button>
              
              {/* Share Dropdown */}
              <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button
                  onClick={() => handleShare('twitter')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Share on Twitter
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Share on Facebook
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Share on LinkedIn
                </button>
                <button
                  onClick={() => handleShare('email')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Share via Email
                </button>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <PrinterIcon className="w-5 h-5" />
              Print
            </button>
          </div>

          {/* Featured Image */}
          <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden mb-8 blog-print-image">
            {post.image ? (
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
          </div>

          {/* Excerpt */}
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed italic border-l-4 border-blue-500 pl-6">
            {post.excerpt}
          </p>
        </header>

        {/* Article Content */}
        {post.content ? (
          containsHtml(post.content) ? (
            <div 
              className="prose prose-lg max-w-none prose-headings:text-slate-950 prose-h2:rounded-xl prose-h2:border-l-4 prose-h2:border-[#0057b8] prose-h2:bg-blue-50 prose-h2:px-4 prose-h2:py-3 prose-h2:text-2xl prose-h2:font-extrabold prose-h2:mt-8 prose-h2:mb-4 prose-h3:rounded-lg prose-h3:bg-cyan-50 prose-h3:px-3 prose-h3:py-2 prose-h3:text-xl prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-slate-700 prose-p:leading-relaxed prose-li:text-slate-700 prose-strong:text-slate-950 blog-print-content"
              dangerouslySetInnerHTML={{ __html: enhancedHtmlContent }}
            />
          ) : (
            renderPlainArticleContent(post.content)
          )
        ) : (
          <div className="prose prose-lg max-w-none">
            <p className="text-slate-700 leading-relaxed text-lg mb-8">
              {post.excerpt}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-800 font-medium">
                This article is currently being expanded with full content. Please check back soon for the complete article.
              </p>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-gray-200 blog-no-print">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {articleTags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Author Bio */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl blog-no-print">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {authorInitials}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {authorName}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                TechUniqueIIT Research Center publishes research-driven learning resources and evidence-based content.
              </p>
              <div className="mt-4">
                <Link
                  href="/about"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  Learn more about TechUniqueIIT Research Center
                  <ArrowLeftIcon className="w-4 h-4 ml-2 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
      </main>

      {/* Related Articles */}
      <section className="bg-gray-50 py-12 lg:py-16 blog-no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
            You Might Also Like
          </h2>
          <div className="text-center">
            <Link
              href="/blog"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Articles
              <ArrowLeftIcon className="w-4 h-4 ml-2 rotate-180" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
