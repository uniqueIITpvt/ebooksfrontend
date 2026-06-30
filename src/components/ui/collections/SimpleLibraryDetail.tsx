import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/primitives/Button';

interface DetailRow {
  label: string;
  value: string;
}

interface SimpleLibraryDetailProps {
  backHref: string;
  backLabel: string;
  category: string;
  title: string;
  author: string;
  description: string;
  image?: string;
  featured?: boolean;
  badge?: string;
  actionLabel: string;
  detailRows?: DetailRow[];
}

export default function SimpleLibraryDetail({
  backHref,
  backLabel,
  category,
  title,
  author,
  description,
  image,
  featured,
  badge,
  actionLabel,
  detailRows = [],
}: SimpleLibraryDetailProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">{backLabel}</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-6">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-xl">
              {image ? (
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover object-center"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
              {featured && (
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Featured
                </div>
              )}
              {badge && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {badge}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {category}
              </span>
            </div>

            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600">by</span>
              <span className="font-semibold text-gray-900">{author}</span>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About This Item</h2>
              <p className="text-gray-600 leading-relaxed">
                {description}
              </p>
            </div>

            {detailRows.length > 0 && (
              <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div>
                      <div className="text-sm text-gray-500">{row.label}</div>
                      <div className="font-semibold">{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <Button variant="primary" fullWidth>
                {actionLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
