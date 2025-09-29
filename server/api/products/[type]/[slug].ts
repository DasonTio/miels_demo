// server/api/products/[slug].ts
import type { ProductBundle } from '~/types/product';

// Define the shape of the API response for a single product
interface SingleProductApiResponse {
  data: ProductBundle;
}

export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type');
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product slug is required.'
    });
  }

  const apiUrl = `https://api-shop.miels.id/api/${type}s/slug/${slug}`;

  try {
    const response = await $fetch<SingleProductApiResponse>(apiUrl);
    if (!response.data) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Product not found'
      });
    }


    return {
      ...response.data,
      images: response.data.bundle_images ?? response.data.product_images ?? []
    };

  } catch (error) {
    console.error(`[API] Error fetching product with slug ${slug}:`, error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch product data.'
    });
  }
});