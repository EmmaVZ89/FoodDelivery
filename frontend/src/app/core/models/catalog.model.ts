export interface Category {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  isAvailable: boolean;
  isPromotion: boolean;
  discountPercent: number;
  hasVariants: boolean;
  sortOrder: number;
  variants: ProductVariant[];
  customizationGroups: CustomizationGroup[];
  minVariantPrice?: number | null;
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  selectionCount: number;
  sortOrder: number;
  isActive: boolean;
}

export interface CustomizationGroup {
  id: number;
  productId: number;
  name: string;
  selectionType: SelectionType;
  minSelections: number;
  maxSelections: number | null;
  isRequired: boolean;
  sortOrder: number;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: number;
  groupId: number;
  name: string;
  priceModifier: number;
  isActive: boolean;
  sortOrder: number;
}

export type SelectionType = 'Single' | 'Multiple' | 'Quantity';

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
