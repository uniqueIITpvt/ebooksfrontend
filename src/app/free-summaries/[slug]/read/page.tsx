import PagedReadClient from '@/app/read/[slug]/PagedReadClient';

interface FreeSummaryReadPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function FreeSummaryReadPage({ params }: FreeSummaryReadPageProps) {
  const { slug } = await params;

  return <PagedReadClient slug={slug} />;
}
