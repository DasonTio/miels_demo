import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '@/types/database';
import type { ProductDetail } from '@/types/productDetail';

const parseImages = (imagesData: unknown): string[] => {
  if (Array.isArray(imagesData)) return imagesData.map(String);
  if (typeof imagesData === 'string') {
    try {
      const parsed = JSON.parse(imagesData);
      return Array.isArray(parsed) ? parsed : [];
    } catch{
      return [];
    }
  }
  return [];
};

export default defineEventHandler(async (event): Promise<ProductDetail> => {
  const slug = event.context.params?.slug;
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' });

  const client = await serverSupabaseClient<Database>(event);

  const { data: product } = await client
    .from('products').select('id, name, slug, price, description, images, is_best_seller, category:categories (name, slug)')
    .eq('slug', slug).single();

  if (product) {
    return {
      ...product,
      images: parseImages(product.images),
      type: 'product'
    };
  }

  const { data: bundle } = await client
    .from('bundles').select(`
      id, name, slug, price, description, images, is_best_seller,
      category:categories (name, slug),
      bundle_items:bundle_product_items (variant_name, product:products (id, name, slug, price, images))
    `).eq('slug', slug).single();

  if (bundle) {
    return {
      ...bundle,
      images: parseImages(bundle.images), 
      type: 'bundle'
    };
  }

  throw createError({ statusCode: 404, statusMessage: 'Product not found' });
});