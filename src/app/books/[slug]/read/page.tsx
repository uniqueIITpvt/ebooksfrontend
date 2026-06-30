import BookReadClient from './BookReadClient';

interface BookReadPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BookReadPage({ params }: BookReadPageProps) {
  const { slug } = await params;

  return <BookReadClient slug={slug} />;
}
