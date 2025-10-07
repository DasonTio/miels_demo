import type { Json } from "./database";

interface BundleItemProduct {
  id: number;
  name: string;
  slug: string | null;
  price: number | null;
  images: Json | null;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string | null;
  price: number | null;
  description: string | null;
  images: string[];
  is_best_seller: boolean | null;
  category: {
    name: string;
    slug: string | null;
  } | null;
  type: 'product' | 'bundle';
  bundle_items?: {
    variant_name: string | null;
    product: BundleItemProduct;
  }[];
}