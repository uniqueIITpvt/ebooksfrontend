import { Suspense } from 'react';

import BooksPageClient from './BooksPageClient';
import { getBooksHeroBanners, getBooksPageData } from '@/lib/server/public-data';

export default async function BooksPage() {
  const [{ allBooks, categories, languages }, heroBanners] = await Promise.all([
    getBooksPageData(),
    getBooksHeroBanners(),
  ]);

  return (
    <Suspense fallback={null}>
      <BooksPageClient
        allBooks={allBooks}
        categories={categories}
        heroBanners={heroBanners}
        languages={languages}
      />
    </Suspense>
  );
}
