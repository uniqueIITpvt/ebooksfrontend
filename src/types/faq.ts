export interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  detailedAnswer?: string;
  category: string;
  popular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
