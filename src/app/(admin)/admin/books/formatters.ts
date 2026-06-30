export const getInlineAssetUrl = (url?: string | null) => {
  if (!url) return null;

  return url
    .replace('/upload/fl_attachment:false/', '/upload/')
    .replace('/upload/fl_attachment/', '/upload/')
    .replace(
      /\/upload\/([^/]*?)fl_attachment(?::[^,/]+)?[,]?([^/]*?)\//,
      (_match, before = '', after = '') => {
        const transforms = `${before}${after}`
          .replace(/^,|,$/g, '')
          .replace(/,,+/g, ',');

        return transforms ? `/upload/${transforms}/` : '/upload/';
      }
    );
};

export const getNumericBookValue = (value: unknown, fallback = 0) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const numericValue = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  return fallback;
};

export const formatInrPrice = (price?: string | number | null) => {
  if (price === undefined || price === null || price === '') return 'â‚¹0.00';
  const numericPrice = typeof price === 'number'
    ? price
    : parseFloat(String(price).replace(/[^0-9.]/g, ''));

  if (Number.isNaN(numericPrice)) return String(price).replace('$', 'â‚¹');

  return `â‚¹${numericPrice.toFixed(2)}`;
};

export const formatBookListValue = (value?: string[] | null) => {
  if (!value || value.length === 0) return '-';
  return value.join(', ');
};

export const formatBookDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

export const formatPriceMap = (value?: Record<string, string> | null) => {
  if (!value || Object.keys(value).length === 0) return '-';
  return Object.entries(value)
    .map(([key, price]) => `${key}: ${formatInrPrice(price)}`)
    .join(', ');
};
