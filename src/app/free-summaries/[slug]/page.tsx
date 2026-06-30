import { notFound } from 'next/navigation';
import SimpleLibraryDetail from '@/components/ui/collections/SimpleLibraryDetail';
import { getFreeSummaryBySlug } from '@/lib/server/public-data';

export default async function FreeSummaryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const summary = await getFreeSummaryBySlug(slug);

  if (!summary) {
    notFound();
  }

  return (
    <SimpleLibraryDetail
      backHref='/free-summaries'
      backLabel='Back to Free Summaries'
      category={summary.category}
      title={summary.title}
      author={summary.author}
      description={summary.description}
      image={summary.image}
      featured={summary.featured}
      actionLabel='Read Free Summary'
      detailRows={[
        ...(summary.pages ? [{ label: 'Pages', value: String(summary.pages) }] : []),
        ...(summary.readingTime ? [{ label: 'Reading Time', value: summary.readingTime }] : []),
      ]}
    />
  );
}
