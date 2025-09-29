// server/api/products/[slug].ts
import type { ProductBundle } from '~/types/product';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');

  try {
    // Fetches LIVE data from the Miels API, not from public.json
    const response = await $fetch<{ data: { data: ProductBundle[] } }>('https://api-shop.miels.id/api/products/public');
    const allProducts = response.data.data;

    // Find the product that matches the slug from the URL
    const product = allProducts.find(p => p.slug === slug);

    if (!product) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Product not found'
      });
    }

    return product;

  } catch  {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch product data.'
    });
  }
});