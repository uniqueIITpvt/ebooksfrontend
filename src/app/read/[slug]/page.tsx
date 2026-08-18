import PagedReadClient from './PagedReadClient';

interface ReadPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
  }>;
}

export default async function ReadPage({ params, searchParams }: ReadPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const requestedReturnTo = resolvedSearchParams?.returnTo || '';
  const backHref = requestedReturnTo.startsWith('/') ? requestedReturnTo : '/profile?tab=library';
  const backLabel = backHref.includes('tab=owned') ? 'Back to Owned Books' : 'Back to Library';

  return (
    <PagedReadClient
      slug={slug}
      backHref={backHref}
      backLabel={backLabel}
      unavailableBackLabel={backLabel}
    />
  );
}
