import { redirect } from 'next/navigation';

interface AuthAliasPageProps {
  searchParams?: Promise<{
    mode?: string;
    returnUrl?: string;
  }>;
}

export default async function AuthAliasPage({
  searchParams,
}: AuthAliasPageProps) {
  const params = (await searchParams) || {};
  const mode = params.mode === 'signup' ? 'signup' : 'signin';
  const returnUrl = params.returnUrl
    ? `&returnUrl=${encodeURIComponent(params.returnUrl)}`
    : '';

  redirect(`/user/auth?mode=${mode}${returnUrl}`);
}
