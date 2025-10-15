import { serverSupabaseClient } from "#supabase/server";
import { parseImages } from "~/utils/utilities";
import type { Database } from "~~/app/types/database";
import type { DisplayProduct } from "~~/app/types/product";

export default defineEventHandler(async (event): Promise<DisplayProduct[]> => {
  const client = await serverSupabaseClient<Database>(event);

  const { data: bundles, error } = await client
    .from("bundles")
    .select(
      "id, name, slug, price, images, is_active, is_best_seller, category:categories (name, slug)"
    )
    .eq("is_active", true);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  if (!bundles) {
    return [];
  }

  const formattedBundles: DisplayProduct[] = bundles.map((b) => ({
    ...b,
    stock: null,
    images: parseImages(b.images),
    type: "bundle",
  }));

  return formattedBundles;
});
