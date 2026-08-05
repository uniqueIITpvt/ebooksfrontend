import { API_CONFIG } from '@/config/api';

export interface Testimonial {
  _id: string;
  name: string;
  role?: string;
  company?: string;
  image?: string;
  content: string;
  detailedContent?: string;
  rating: number;
  format?: string;
  featured: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestimonialStat {
  label: string;
  value: string;
}

export interface PublishedTestimonialsResponse {
  testimonials: Testimonial[];
  stats: TestimonialStat[];
}

const defaultStats: TestimonialStat[] = [
  { label: 'Resources Shared', value: '700+' },
  { label: 'Verified Reviews', value: 'Real' },
  { label: 'Curated Content', value: 'Weekly' },
  { label: 'Years of Work', value: '5+' },
];

export async function getPublishedTestimonials(): Promise<PublishedTestimonialsResponse> {
  const response = await fetch(`${API_CONFIG.API_BASE_URL}/testimonials`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return { testimonials: [], stats: defaultStats };
  }

  const data = await response.json();
  if (!data?.success) {
    return { testimonials: [], stats: defaultStats };
  }

  if (Array.isArray(data.data)) {
    return { testimonials: data.data, stats: defaultStats };
  }

  return {
    testimonials: Array.isArray(data.data?.testimonials)
      ? data.data.testimonials
      : [],
    stats: Array.isArray(data.data?.stats) ? data.data.stats : defaultStats,
  };
}
