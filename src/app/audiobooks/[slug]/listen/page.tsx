import AudiobookListenClient from './AudiobookListenClient';

interface AudiobookListenPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AudiobookListenPage({
  params,
}: AudiobookListenPageProps) {
  const { slug } = await params;

  return <AudiobookListenClient slug={slug} />;
}
