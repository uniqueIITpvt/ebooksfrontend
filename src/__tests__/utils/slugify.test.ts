import {
  generateBlogSlug,
  generateBookSlug,
  generatePodcastSlug,
  generateSlug,
} from '@/utils/slugify';

describe('slugify utilities', () => {
  test('normalizes a title into a lowercase URL slug', () => {
    expect(generateSlug('  The Art of Focus  ')).toBe('the-art-of-focus');
  });

  test('removes punctuation and collapses repeated separators', () => {
    expect(generateSlug('AI, Books & Learning---Fast!!')).toBe(
      'ai-books-learning-fast'
    );
  });

  test('returns an empty slug when no URL-safe characters remain', () => {
    expect(generateSlug('!!!')).toBe('');
  });

  test('book, blog, and podcast helpers delegate to the same slug behavior', () => {
    expect(generateBookSlug('Deep Work')).toBe('deep-work');
    expect(generateBlogSlug('Weekly Reading Notes')).toBe('weekly-reading-notes');
    expect(generatePodcastSlug('Learn With Us')).toBe('learn-with-us');
  });
});
