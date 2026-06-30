import SimpleLibraryPage from '@/components/ui/collections/SimpleLibraryPage';
import { getHomePageData } from '@/lib/server/public-data';

export default async function TrendingBooksPage() {
  const { trendingBooks } = await getHomePageData();

  return (
    <SimpleLibraryPage
      title='Trending Books'
      items={trendingBooks}
      searchPlaceholder='Search trending books...'
      emptyMessage='No trending books found.'
      detailBasePath='/books'
      defaultMetaLabel='Trending'
      variant='landing'
    />
  );
}
