import { notFound } from 'next/navigation';
import BookDetailClient from './BookDetailClient';
import { getBookBySlug, getRelatedBooks } from '@/lib/server/public-data';

interface BookSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BookSlugPage({ params }: BookSlugPageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  const relatedBooks = await getRelatedBooks(book);

  return <BookDetailClient book={book} relatedBooks={relatedBooks} />;
}
