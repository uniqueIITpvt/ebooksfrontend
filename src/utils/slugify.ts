/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a slug from a book title
 * @param title - The book title
 * @returns A URL-friendly slug
 */
export function generateBookSlug(title: string): string {
  return generateSlug(title);
}

/**
 * Generate a slug from a blog title
 * @param title - The blog title
 * @returns A URL-friendly slug
 */
export function generateBlogSlug(title: string): string {
  return generateSlug(title);
}

/**
 * Generate a slug from a podcast title
 * @param title - The podcast title
 * @returns A URL-friendly slug
 */
export function generatePodcastSlug(title: string): string {
  return generateSlug(title);
}
