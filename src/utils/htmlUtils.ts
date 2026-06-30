/**
 * Utility functions for handling HTML content
 */

/**
 * Strip HTML tags from a string and return plain text
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  
  // Use regex-based approach to avoid DOM manipulation issues
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
  
  // Remove extra whitespace and trim
  return text.replace(/\s+/g, ' ').trim();
};

/**
 * Get word count from HTML content
 */
export const getWordCount = (html: string): number => {
  const plainText = stripHtmlTags(html);
  if (!plainText.trim()) return 0;
  
  return plainText.trim().split(/\s+/).length;
};

/**
 * Calculate estimated read time based on word count
 * Average reading speed: 200-250 words per minute
 */
export const calculateReadTime = (html: string): string => {
  const wordCount = getWordCount(html);
  const wordsPerMinute = 225; // Average reading speed
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  if (minutes < 1) return '< 1 min read';
  return `${minutes} min read`;
};

/**
 * Validate HTML content length
 */
export const validateHtmlContent = (html: string, minLength: number = 10, maxLength: number = 50000): { isValid: boolean; message?: string } => {
  const plainText = stripHtmlTags(html);
  const length = plainText.trim().length;
  
  if (length === 0) {
    return { isValid: false, message: 'Content is required' };
  }
  
  if (length < minLength) {
    return { isValid: false, message: `Content must be at least ${minLength} characters long` };
  }
  
  if (length > maxLength) {
    return { isValid: false, message: `Content must not exceed ${maxLength} characters` };
  }
  
  return { isValid: true };
};

/**
 * Generate excerpt from HTML content
 */
export const generateExcerpt = (html: string, maxLength: number = 200): string => {
  const plainText = stripHtmlTags(html);
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Find the last complete word within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
};
