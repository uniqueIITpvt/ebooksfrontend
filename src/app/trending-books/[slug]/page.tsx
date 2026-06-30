import { notFound } from 'next/navigation';
import SimpleLibraryDetail from '@/components/ui/collections/SimpleLibraryDetail';
import { getTrendingBookBySlug } from '@/lib/server/public-data';

export default async function TrendingBookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getTrendingBookBySlug(slug);

  if (!book) {
    notFound();
  }

  return (
    <SimpleLibraryDetail
      backHref='/trending-books'
      backLabel='Back to Trending Books'
      category={book.category}
      title={book.title}
      author={book.author}
      description={book.description}
      image={book.image}
      featured={book.featured}
      badge={book.sales > 0 ? 'Hot' : undefined}
      actionLabel='View Details'
      detailRows={[
        ...(book.pages ? [{ label: 'Pages', value: String(book.pages) }] : []),
        { label: 'Views', value: book.views.toLocaleString() },
      ]}
    />
  );
}
