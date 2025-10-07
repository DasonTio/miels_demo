import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~~/app/types/database';

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string | null;
}

export default defineEventHandler(async (event): Promise<CategoryResponse[]> => {
  const client = await serverSupabaseClient<Database>(event);

  const { data, error } = await client
    .from('categories')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data.filter(Boolean) as CategoryResponse[];
});