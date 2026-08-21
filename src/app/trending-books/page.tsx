import SimpleLibraryPage from '@/components/ui/collections/SimpleLibraryPage';
import { getTrendingBooksPageData } from '@/lib/server/public-data';

export default async function TrendingBooksPage() {
  const trendingBooks = await getTrendingBooksPageData();
  const items = trendingBooks.map((book) => ({
    ...book,
    price: String(book.price),
    originalPrice: book.originalPrice == null ? null : String(book.originalPrice),
  }));

  return (
    <SimpleLibraryPage
      title='Trending Books'
      items={items}
      searchPlaceholder='Search trending books...'
      emptyMessage='No trending books found.'
      detailBasePath='/books'
      defaultMetaLabel='Trending'
      variant='landing'
    />
  );
}
