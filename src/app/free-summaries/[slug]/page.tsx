import { notFound } from 'next/navigation';
import SimpleLibraryDetail from '@/components/ui/collections/SimpleLibraryDetail';
import { getFreeSummaryBySlug } from '@/lib/server/public-data';

export default async function FreeSummaryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const summary = await getFreeSummaryBySlug(slug);

  if (!summary) {
    notFound();
  }

  const summaryMeta = summary as typeof summary & {
    rating?: number;
    reviews?: number;
  };

  return (
    <SimpleLibraryDetail
      backHref='/'
      backLabel='Back to Free Summaries'
      category={summary.category}
      title={summary.title}
      author={summary.author}
      description={summary.description}
      image={summary.image}
      featured={summary.featured}
      actionLabel='Read Free Summary'
      actionHref={`/free-summaries/${slug}/read`}
      actionRequiresAuth
      compactMedia
      ratingId={summary.slug || summary._id || slug}
      meta={{
        rating: summaryMeta.rating ?? 0,
        reviews: summaryMeta.reviews ?? 0,
        pages: summary.pages,
        readingTime: summary.readingTime,
        type: 'Free Summary',
        publishDate: summary.publishDate,
      }}
      detailRows={[
        ...(summary.pages ? [{ label: 'Pages', value: String(summary.pages) }] : []),
        ...(summary.readingTime ? [{ label: 'Reading Time', value: summary.readingTime }] : []),
      ]}
    />
  );
}
