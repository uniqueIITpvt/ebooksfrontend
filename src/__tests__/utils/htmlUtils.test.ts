import {
  calculateReadTime,
  generateExcerpt,
  getWordCount,
  stripHtmlTags,
  validateHtmlContent,
} from '@/utils/htmlUtils';

describe('htmlUtils', () => {
  test('strips tags, decodes common entities, and normalizes whitespace', () => {
    expect(
      stripHtmlTags('<p>Hello&nbsp;<strong>World</strong> &amp; Team</p>')
    ).toBe('Hello World & Team');
  });

  test('counts words from rendered text rather than raw markup', () => {
    expect(getWordCount('<h1>Read better</h1><p>Think deeper today.</p>')).toBe(
      5
    );
  });

  test('calculates sub-minute and rounded read times', () => {
    expect(calculateReadTime('<p>short text</p>')).toBe('1 min read');
    expect(calculateReadTime('')).toBe('< 1 min read');
    expect(calculateReadTime(Array.from({ length: 226 }, () => 'word').join(' '))).toBe(
      '2 min read'
    );
  });

  test('validates required, minimum, maximum, and acceptable content lengths', () => {
    expect(validateHtmlContent('')).toEqual({
      isValid: false,
      message: 'Content is required',
    });
    expect(validateHtmlContent('<p>tiny</p>', 10)).toEqual({
      isValid: false,
      message: 'Content must be at least 10 characters long',
    });
    expect(validateHtmlContent('<p>too long</p>', 1, 3)).toEqual({
      isValid: false,
      message: 'Content must not exceed 3 characters',
    });
    expect(validateHtmlContent('<p>Enough content</p>', 10)).toEqual({
      isValid: true,
    });
  });

  test('generates excerpts without cutting through the last complete word when possible', () => {
    expect(generateExcerpt('<p>The quick brown fox jumps</p>', 16)).toBe(
      'The quick brown...'
    );
    expect(generateExcerpt('<p>Short text</p>', 50)).toBe('Short text');
    expect(generateExcerpt('<p>Supercalifragilistic</p>', 5)).toBe('Super...');
  });
});
