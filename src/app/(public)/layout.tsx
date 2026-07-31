import Navbar from '@/components/ui/layout/Navbar';
import Footer from '@/components/ui/layout/Footer';
import { getPublicShellData } from '@/lib/server/public-data';

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
    </>
  );
}
