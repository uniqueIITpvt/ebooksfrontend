import SimpleLibraryPage from '@/components/ui/collections/SimpleLibraryPage';
import { getHomePageData } from '@/lib/server/public-data';

export default async function PremiumSummariesPage() {
  const { premiumSummaries } = await getHomePageData();

  return (
    <SimpleLibraryPage
      title='Premium Summaries'
      items={premiumSummaries}
      searchPlaceholder='Search premium summaries...'
      emptyMessage='No premium summaries found.'
      detailBasePath='/books'
      defaultMetaLabel='Premium Summary'
      variant='landing'
    />
  );
}
