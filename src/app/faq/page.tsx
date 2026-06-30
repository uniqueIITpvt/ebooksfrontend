import FAQ from '@/components/ui/sections/FAQ';
import { getFaqPageData } from '@/lib/server/public-data';

export default async function FAQPage() {
  const data = await getFaqPageData();

  return (
    <div className='min-h-screen'>
      <FAQ faqs={data.faqs} categories={data.categories} />
    </div>
  );
}
