// server/api/products/index.ts
import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '@/types/database';
import type { DisplayProduct } from '@/types/product';

// Helper function to safely parse the images data
const parseImages = (imagesData: unknown): string[] => {
  if (Array.isArray(imagesData)) return imagesData.map(String);
  if (typeof imagesData === 'string') {
    try {
      const parsed = JSON.parse(imagesData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default defineEventHandler(async (event): Promise<DisplayProduct[]> => {
  const client = await serverSupabaseClient<Database>(event);

  const [productsResponse, bundlesResponse] = await Promise.all([
    client.from('products').select('id, name, slug, price, images, is_best_seller, category:categories (name, slug)').eq('is_active', true),
    client.from('bundles').select('id, name, slug, price, images, is_best_seller, category:categories (name, slug)').eq('is_active', true)
  ]);

  const { data: products, error: productsError } = productsResponse;
  const { data: bundles, error: bundlesError } = bundlesResponse;

  if (productsError) throw createError({ statusCode: 500, statusMessage: productsError.message });
  if (bundlesError) throw createError({ statusCode: 500, statusMessage: bundlesError.message });
  if (!products || !bundles) throw createError({ statusCode: 500, statusMessage: 'Could not fetch data' });

  const formattedProducts: DisplayProduct[] = products.map(p => ({
    ...p,
    images: parseImages(p.images), // Use the helper
    type: 'product'
  }));

  const formattedBundles: DisplayProduct[] = bundles.map(b => ({
    ...b,
    images: parseImages(b.images), // Use the helper
    type: 'bundle'
  }));

  return [...formattedProducts, ...formattedBundles];
});