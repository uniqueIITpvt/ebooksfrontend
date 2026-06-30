export interface PublicBookAudioFileRef {
  url?: string | null;
}

export interface PublicBookListItem {
  id: string;
  _id?: string;
  slug?: string;
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  category: string;
  type: 'Books' | 'Audiobook';
  componentType?: 'none' | 'free-summaries' | 'trending-books' | 'premium-summaries';
  price: string;
  originalPrice?: string | null;
  rating: number;
  reviews: number;
  pages?: number;
  duration?: string;
  narrator?: string;
  publishDate: string;
  format: string[];
  featured: boolean;
  bestseller: boolean;
  tags: string[];
  language?: string;
  image?: string | null;
  files?: {
    audiobook?: PublicBookAudioFileRef | null;
  } | null;
}
