'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { generateBlogSlug } from '@/utils/slugify';
import type { BlogPost } from '@/lib/server/public-data';

interface BlogPageClientProps {
  blogs: BlogPost[];
  categories: { name: string; value: string }[];
  blogSettings: {
    title: string;
    subtitle: string;
  };
}

const normalizeTags = (tags?: string[] | string) => {
  if (!tags) return [] as string[];

  if (Array.isArray(tags)) {
    return tags;
  }

  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function BlogPageClient({
  blogs,
  categories,
  blogSettings,
}: BlogPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredBlogs = blogs.filter((blog) => {
    const parsedTags = normalizeTags(blog.tags);
    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parsedTags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || blog.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const clearSearch = () => {
    setSearchTerm('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen sm:pt-3 lg:pt-3 bg-white">
      <section className="bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              {blogSettings.title}
              {blogSettings.subtitle && (
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {blogSettings.subtitle}
                </span>
              )}
            </h1>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="block w-full pl-12 pr-12 py-4 text-lg border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-nowrap md:flex-wrap md:justify-center gap-3 mb-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
            <div className="flex md:flex-wrap gap-3 min-w-max md:min-w-0 px-4 md:px-0">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap ${
                    selectedCategory === category.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {searchTerm && (
            <div className="mt-6 text-center text-gray-600">
              {filteredBlogs.length === 0 ? (
                <span className="text-red-600">No articles found for "{searchTerm}"</span>
              ) : (
                <span>Found {filteredBlogs.length} article{filteredBlogs.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="py-6 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredBlogs.length === 0 && searchTerm ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-gray-300" />
                <h3 className="mt-6 text-xl font-semibold text-gray-900">No articles found</h3>
                <p className="mt-3 text-gray-500">
                  Try adjusting your search terms or browse our categories.
                </p>
                <button
                  onClick={clearSearch}
                  className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                >
                  Clear search
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((blog, index) => {
                const parsedTags = normalizeTags(blog.tags);

                return (
                  <article
                    key={blog._id}
                    className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:transform hover:scale-[1.02] overflow-hidden"
                  >
                    <div className="relative h-48 overflow-hidden">
                      {blog.image ? (
                        <Image
                          src={blog.image}
                          alt={blog.title}
                          fill
                          priority={index < 3}
                          loading={index < 3 ? 'eager' : 'lazy'}
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                      {blog.featured && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                            Featured
                          </span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full">
                          {blog.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {formatDate(blog.publishDate)}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {blog.readTime}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                        {blog.title}
                      </h3>

                      <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                        {blog.excerpt}
                      </p>

                      {parsedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {parsedTags.slice(0, 3).map((tag, index) => (
                            <span
                              key={`${tag}-${index}`}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {parsedTags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{parsedTags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-4">
                          <span>{blog.views?.toLocaleString() || '0'} views</span>
                          <span>{blog.likes?.toLocaleString() || '0'} likes</span>
                        </div>
                      </div>

                      <Link
                        href={`/blog/${blog.slug || generateBlogSlug(blog.title)}`}
                        className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-700 group/link transition-colors duration-200"
                      >
                        Read Article
                        <ArrowRightIcon className="w-4 h-4 ml-2 transform group-hover/link:translate-x-1 transition-transform duration-200" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Stay Updated
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get the latest insights, tips, and evidence-based articles from UniqueIIT Research Center delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Subscribe
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Join 1,000+ readers. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
