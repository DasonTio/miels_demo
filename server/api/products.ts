// server/api/products/index.ts
import type { ProductBundle } from '~/types/product'
import type { CategoryResponse } from './categories';

interface ProductAPIResponse {
  data: {
    data: ProductBundle[];
    meta: {
      currentPage: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
    }
  }
}

export interface ProductResponse{
  products: {
    id: number;
    slug: string;
    name: string;
    price: number;
    type: string;
    imageUrl: string;
    isBestSeller: boolean;
  }[];
  totalPages: number;
  currentPage: number;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = query.page as string || '1';
  const categorySlug = query.category as string | undefined;
  const searchQuery = query.search as string | undefined;
  
  const limit = '12'; 

  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  params.append('is_active', 'true');

  if (categorySlug) {
    try {
      const categories = await $fetch<CategoryResponse[]>('/api/categories', {});
      const matchingCategory = categories.find(c => c.slug === categorySlug);
      
      if (matchingCategory) params.append('categoryId', matchingCategory.id.toString());
    } catch (e) {
      console.error("Could not fetch categories to find ID", e);
    }
  }

  const apiUrl = `https://api-shop.miels.id/api/products/public?${params.toString()}`;

  try {
    const response = await $fetch<ProductAPIResponse>(apiUrl);
    
    let products = response.data.data;
    const meta = response.data.meta;

    if (categorySlug) {
      products = products.filter(p => p.category?.slug === categorySlug);
    }
    if (searchQuery) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const productData = products.map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      imageUrl: p.images[0]?.image_url || '',
      isBestSeller: p.is_best_seller,
      type: p.type,
      categoryName: p.category?.name || 'Uncategorized'
    }));
    
    return {
      products: productData,
      totalPages: meta.totalPages,
      currentPage: meta.currentPage,
    } as ProductResponse

  } catch (error) {
    console.error('[API] Error fetching from Miels API:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch products.'
    });
  }
});