import { notFound } from 'next/navigation';
import SimpleLibraryDetail from '@/components/ui/collections/SimpleLibraryDetail';
import { getPremiumSummaryBySlug } from '@/lib/server/public-data';

export default async function PremiumSummaryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const summary = await getPremiumSummaryBySlug(slug);

  if (!summary) {
    notFound();
  }

  return (
    <SimpleLibraryDetail
      backHref='/premium-summaries'
      backLabel='Back to Premium Summaries'
      category={summary.category}
      title={summary.title}
      author={summary.author}
      description={summary.description}
      image={summary.image}
      featured={summary.featured}
      actionLabel='Get Premium Access'
      detailRows={[
        ...(summary.pages ? [{ label: 'Pages', value: String(summary.pages) }] : []),
        { label: 'Status', value: summary.isActive ? 'Active' : 'Inactive' },
      ]}
    />
  );
}
