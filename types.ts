
export enum PlanTier {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}

export type ProductCategory = 'LETTER' | 'BONUS' | 'UPSELL' | 'LAYOUT';

export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  category: ProductCategory;
  tier: PlanTier; // The minimum tier required to access the FULL content (or specific upsell logic)
  isUpsell?: boolean;
  price?: number;
  description?: string;
  imageUrl?: string;
  // URLs for the actual content files (hosted on Supabase Storage)
  pdfUrl?: string;
  audioUrl?: string;
}

export interface Chapter {
  id: string;
  product_id: string;
  title: string;
  order_index: number;
  pdf_url?: string;
  audio_url?: string;
  created_at?: string;
}

export interface UserState {
  plan: PlanTier;
  ownedUpsells: string[];
}
