import { Suspense } from 'react';

import BooksPageClient from './BooksPageClient';
import { getBooksPageData } from '@/lib/server/public-data';

export default async function BooksPage() {
  const { allBooks, categories, languages } = await getBooksPageData();

  return (
    <Suspense fallback={null}>
      <BooksPageClient
        allBooks={allBooks}
        categories={categories}
        languages={languages}
      />
    </Suspense>
  );
}
