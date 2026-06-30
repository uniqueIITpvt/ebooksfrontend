import SimpleLibraryPage from '@/components/ui/collections/SimpleLibraryPage';
import { getHomePageData } from '@/lib/server/public-data';

export default async function FreeSummariesPage() {
  const { freeSummaries } = await getHomePageData();

  return (
    <SimpleLibraryPage
      title='Free Summaries'
      items={freeSummaries}
      searchPlaceholder='Search free summaries...'
      emptyMessage='No free summaries found.'
      detailBasePath='/books'
      defaultMetaLabel='Free Summary'
      variant='landing'
    />
  );
}
