import { notFound } from 'next/navigation';
import AudiobookDetailClient from './AudiobookDetailClient';
import { getAudiobookBySlug } from '@/lib/server/public-data';

interface AudiobookSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AudiobookSlugPage({ params }: AudiobookSlugPageProps) {
  const { slug } = await params;
  const audiobook = await getAudiobookBySlug(slug);

  if (!audiobook) {
    notFound();
  }

  return <AudiobookDetailClient audiobook={audiobook} />;
}
