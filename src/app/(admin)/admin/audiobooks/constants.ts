import type { Audiobook } from '@/services/api/audiobooksApi';

export const statuses: Array<Audiobook['status']> = ['draft', 'review', 'published', 'archived'];
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const MAX_AUDIOBOOK_SIZE_MB = 50;
export const MAX_AUDIOBOOK_SIZE_BYTES = MAX_AUDIOBOOK_SIZE_MB * 1024 * 1024;
export const MAX_DESCRIPTION_LENGTH = 10000;
