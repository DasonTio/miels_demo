import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/app/types/database";
import type { DisplayProduct } from "~~/app/types/product";

export default defineEventHandler(async (event): Promise<DisplayProduct[]> => {
  const client = await serverSupabaseClient<Database>(event);

  const [productsResponse, bundlesResponse] = await Promise.all([
    client
      .from("products")
      .select(
        "id, name, slug, price, stock, is_active, is_best_seller, images, category:categories (name, slug)"
      ),
    client
      .from("bundles")
      .select(
        "id, name, slug, price, is_active, is_best_seller, images, category:categories (name, slug)"
      ),
  ]);

  if (productsResponse.error) {
    throw createError({
      statusCode: 500,
      statusMessage: productsResponse.error.message,
    });
  }
  if (bundlesResponse.error) {
    throw createError({
      statusCode: 500,
      statusMessage: bundlesResponse.error.message,
    });
  }

  const parseImages = (imagesData: unknown): string[] => {
    if (Array.isArray(imagesData)) return imagesData.map(String);
    if (typeof imagesData === "string") {
      try {
        const parsed = JSON.parse(imagesData);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const formattedProducts = productsResponse.data.map((p) => ({
    ...p,
    images: parseImages(p.images),
    type: "product" as const,
  }));
  const formattedBundles = bundlesResponse.data.map((b) => ({
    ...b,
    stock: null,
    images: parseImages(b.images),
    type: "bundle" as const,
  }));

  const allItems = [...formattedProducts, ...formattedBundles];
  return allItems.sort((a, b) => a.name.localeCompare(b.name));
});
