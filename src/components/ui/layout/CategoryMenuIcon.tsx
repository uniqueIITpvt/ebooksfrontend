'use client';

import type { ComponentType, SVGProps } from 'react';
import {
  AcademicCapIcon,
  BanknotesIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  IdentificationIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  SparklesIcon,
  Squares2X2Icon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { Category } from '@/services/api/categoriesApi';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const iconRules: Array<{ terms: string[]; Icon: IconComponent }> = [
  { terms: ['financial', 'finance', 'money'], Icon: BanknotesIcon },
  { terms: ['mindset', 'belief', 'self improvement', 'motivation', 'inspiration'], Icon: LightBulbIcon },
  { terms: ['habit', 'productivity'], Icon: SparklesIcon },
  { terms: ['communication'], Icon: ChatBubbleLeftRightIcon },
  { terms: ['personal growth', 'psychology', 'mental', 'wellness'], Icon: HeartIcon },
  { terms: ['professional', 'course', 'education'], Icon: AcademicCapIcon },
  { terms: ['business'], Icon: BriefcaseIcon },
  { terms: ['biograph', 'profile'], Icon: IdentificationIcon },
  { terms: ['leadership', 'success'], Icon: TrophyIcon },
  { terms: ['technology', 'innovation'], Icon: RocketLaunchIcon },
  { terms: ['analytics', 'market'], Icon: ChartBarIcon },
  { terms: ['team', 'social'], Icon: UserGroupIcon },
  { terms: ['book', 'reading'], Icon: BookOpenIcon },
];

export function CategoryMenuIcon({
  category,
  className = 'h-5 w-5',
}: {
  category: Category;
  className?: string;
}) {
  const searchable = `${category.name} ${category.slug || ''} ${category.icon || ''}`.toLowerCase();
  const match = iconRules.find(({ terms }) => terms.some((term) => searchable.includes(term)));
  const Icon = match?.Icon || Squares2X2Icon;

  return <Icon className={className} />;
}
