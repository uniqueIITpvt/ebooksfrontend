import SimpleLibraryPage from '@/components/ui/collections/SimpleLibraryPage';
import { getFreeSummariesPageData } from '@/lib/server/public-data';

export default async function FreeSummariesPage() {
  const freeSummaries = await getFreeSummariesPageData();

  return (
    <SimpleLibraryPage
      title='Free Summaries'
      items={freeSummaries}
      searchPlaceholder='Search free summaries...'
      emptyMessage='No free summaries found.'
      detailBasePath='/free-summaries'
      defaultMetaLabel='Free Summary'
      variant='landing'
    />
  );
}
