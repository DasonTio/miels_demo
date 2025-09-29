export interface Variant {
  product_id: number;
  variant_name: string;
  product: {
    name: string;
    price: number;
    stock: number;
    product_images: { image_url: string }[];
  }
}
export interface BundleItem {
  bundle_item_id: number;
  name: string;
  items: Variant[];
}

export interface ProductCategory{
  category_id: number;
  name: string;
  slug: string;
}

export interface ProductBundle {
  id: number;
  name:string;
  slug: string;
  description: string;
  price: number;
  is_best_seller: boolean;
  type: string;
  images: { image_url: string }[];
  product_images: { image_url: string }[];
  bundle_images: { image_url: string }[];
  bundle_items: BundleItem[];
  category: ProductCategory;
}