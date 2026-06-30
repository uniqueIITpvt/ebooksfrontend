import PagedReadClient from './PagedReadClient';

interface ReadPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { slug } = await params;

  return <PagedReadClient slug={slug} />;
}
