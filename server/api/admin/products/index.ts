/* eslint-disable @typescript-eslint/no-unused-vars */
import { serverSupabaseClient } from "#supabase/server";
import type { H3Event } from "h3";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~~/app/types/database";
import type { DisplayProduct } from "~~/app/types/product";

type ProductCreatePayload = Partial<DisplayProduct> & {
  category_id?: number | null;
};

// --- Type Definitions ---
type HandlerParams = {
  client: SupabaseClient<Database>;
  event: H3Event;
};

// --- Main Event Handler ---
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const params = { client, event };

  switch (event.method) {
    case "GET":
      return getAllProductsHandler(params);
    case "POST":
      return createProductHandler(params);
    default:
      throw createError({
        statusCode: 405,
        statusMessage: "Method Not Allowed",
      });
  }
});

/**
 * Handles GET requests.
 * Fetches all products and bundles for the admin management table.
 */
async function getAllProductsHandler({ client }: Omit<HandlerParams, "event">) {
  const [productsResponse] = await Promise.all([
    client.from("products").select("*, category:categories(*)"),
    // client.from("bundles").select("*, category:categories(*)"),
  ]);

  if (productsResponse.error)
    throw createError({
      statusCode: 500,
      statusMessage: productsResponse.error.message,
    });
  // if (bundlesResponse.error)
  //   throw createError({
  //     statusCode: 500,
  //     statusMessage: bundlesResponse.error.message,
  //   });

  const parseImages = (imagesData: unknown): string[] => {
    if (Array.isArray(imagesData)) return imagesData.map(String);
    if (typeof imagesData === "string") {
      try {
        const parsed = JSON.parse(imagesData);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
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
  // const formattedBundles = bundlesResponse.data.map((b) => ({
  //   ...b,
  //   stock: null,
  //   images: parseImages(b.images),
  //   type: "bundle" as const,
  // }));

  // const allItems = [...formattedProducts, ...formattedBundles];
  const allItems = [...formattedProducts];
  return allItems.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Handles POST requests.
 * Creates a new product or bundle.
 */
async function createProductHandler({ client, event }: HandlerParams) {
  const body = await readBody<ProductCreatePayload>(event);

  if (!body.name || !body.price) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required fields.",
    });
  }

  const tableName = body.type === "bundle" ? "bundles" : "products";

  if (!body.slug) {
    body.slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-*|-*$/g, "");
  }

  const { data, error } = await client
    .from(tableName)
    .insert({
      // All fields from your form
      name: body.name,
      slug: body.slug,
      description: body.description,
      price: body.price,
      stock: body.stock,
      is_active: body.is_active ?? true,
      is_best_seller: body.is_best_seller ?? false,
      images: body.images || [], // Now receives full URLs
      category_id: body.category_id, // Now receives the correct ID
      unit: body.unit,
      size: body.size,
      min_purchase: body.min_purchase,
      bpom_number: body.bpom_number,
      sku_id: body.sku_id,
      weight_gr: body.weight_gr,
      length_cm: body.length_cm,
      width_cm: body.width_cm,
      height_cm: body.height_cm,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw createError({
        statusCode: 409,
        statusMessage: "A product with this name or slug already exists.",
      });
    }
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data;
}
