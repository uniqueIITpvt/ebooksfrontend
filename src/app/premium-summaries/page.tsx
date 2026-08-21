import SimpleLibraryPage from '@/components/ui/collections/SimpleLibraryPage';
import { getPremiumSummariesPageData } from '@/lib/server/public-data';

export default async function PremiumSummariesPage() {
  const premiumSummaries = await getPremiumSummariesPageData();
  const items = premiumSummaries.map((summary) => ({
    ...summary,
    price: String(summary.price),
    originalPrice: summary.originalPrice == null ? null : String(summary.originalPrice),
  }));

  return (
    <SimpleLibraryPage
      title='Premium Summaries'
      items={items}
      searchPlaceholder='Search premium summaries...'
      emptyMessage='No premium summaries found.'
      detailBasePath='/books'
      defaultMetaLabel='Premium Summary'
      variant='landing'
    />
  );
}
