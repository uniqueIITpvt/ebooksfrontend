import PagedReadClient from '@/app/read/[slug]/PagedReadClient';

interface BookReadPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BookReadPage({ params }: BookReadPageProps) {
  const { slug } = await params;

  return (
    <PagedReadClient
      slug={slug}
      backHref={`/books/${slug}`}
      backLabel="Back to Book"
      unavailableBackLabel="Back to Book"
    />
  );
}
