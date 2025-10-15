import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database } from "~~/app/types/database"; // Use Nuxt's `~/` alias

/**
 * A robust helper to parse image data, handling various formats.
 */
function parseImages(imagesData: unknown): string[] {
  if (Array.isArray(imagesData)) return imagesData.map(String);
  if (typeof imagesData !== "string" || imagesData === "null") return [];

  try {
    let parsed = JSON.parse(imagesData);
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const client = await serverSupabaseClient<Database>(event);

  const { data, error } = await client
    .from("orders")
    .select(
      `
      *,
      order_items (
        quantity,
        price_at_purchase,
        product:products (name, images)
      )
    `
    )
    .eq("user_id", user.sub)
    .order("created_at", { ascending: false });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  if (!data) {
    return [];
  }

  const formattedData = data.map((order) => ({
    ...order,
    order_items: order.order_items.map((item) => ({
      ...item,
      product: item.product
        ? {
            ...item.product,
            images: parseImages(item.product.images),
          }
        : null,
    })),
  }));

  return formattedData;
});
