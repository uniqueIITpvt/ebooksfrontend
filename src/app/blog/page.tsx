import BlogPageClient from './BlogPageClient';
import { getBlogListingData } from '@/lib/server/public-data';

export default async function BlogPage() {
  const data = await getBlogListingData();

  return (
    <BlogPageClient
      blogs={data.blogs}
      categories={data.categories}
      blogSettings={data.blogSettings}
    />
  );
}
