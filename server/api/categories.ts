interface CategoryAPIResponse {
  category_id: number;
  name: string;
  slug: string;
}

export interface CategoryResponse{
  id: number;
  name: string;
  slug: string;
}

export default defineEventHandler(async () => {
  try {
    const response = await $fetch<{ data: CategoryAPIResponse[] }>('https://api-shop.miels.id/api/categories');

    return response.data.map(cat => ({
      id: cat.category_id,
      name: cat.name,
      slug: cat.slug,
    })) as CategoryResponse[];

  } catch (error) {
    console.error('[API] Error fetching categories:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch categories.',
    });
  }
});