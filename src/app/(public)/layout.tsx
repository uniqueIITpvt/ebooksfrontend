import dynamic from 'next/dynamic';
import Navbar from '@/components/ui/layout/Navbar';
import Footer from '@/components/ui/layout/Footer';
import { getPublicShellData } from '@/lib/server/public-data';

const AutomaticChatEmbed = dynamic(
  () => import('@/components/ui/primitives/AutomaticChatEmbed'),
  {
    ssr: false,
  }
);

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { siteLogo } = await getPublicShellData();

  return (
    <>
      <Navbar siteLogo={siteLogo} />
      <main>{children}</main>
      <Footer siteLogo={siteLogo} />
      <AutomaticChatEmbed />
    </>
  );
}
