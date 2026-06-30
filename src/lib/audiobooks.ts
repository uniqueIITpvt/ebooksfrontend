import type { PublicBookListItem } from '@/types/publicBook';
import { generateBookSlug } from '@/utils/slugify';

export type AudiobookSortOption =
  | 'newest'
  | 'popular'
  | 'rating'
  | 'price-asc'
  | 'price-desc';

export const AUDIOBOOK_SORT_OPTIONS: Array<{
  value: AudiobookSortOption;
  label: string;
}> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

export function isAudiobookSortOption(
  value: string | null
): value is AudiobookSortOption {
  return AUDIOBOOK_SORT_OPTIONS.some((option) => option.value === value);
}

export function parsePriceValue(price?: string | null): number {
  if (!price) return 0;
  return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
}

export function getAudiobookHref(
  item: Pick<PublicBookListItem, 'slug' | 'title'>
): string {
  return `/audiobooks/${item.slug || generateBookSlug(item.title)}`;
}
