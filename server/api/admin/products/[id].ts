/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverSupabaseClient } from "#supabase/server";
import type { H3Event } from "h3";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~~/app/types/database";
import type { DisplayProduct } from "~~/app/types/product";

type ProductUpdatePayload = Partial<DisplayProduct> & {
  category_id?: number | null;
};

// --- Type Definitions ---
type HandlerParams = {
  client: SupabaseClient<Database>;
  productId: number;
  event: H3Event;
};

// --- Main Event Handler ---
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const productId = parseInt(event.context.params!.id);

  if (isNaN(productId)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid Product ID" });
  }

  const params = { client, productId, event };

  switch (event.method) {
    case "GET":
      return getProductHandler(params);
    case "PUT":
      return updateProductHandler(params);
    case "DELETE":
      return deleteProductHandler(params);
    default:
      throw createError({
        statusCode: 405,
        statusMessage: "Method Not Allowed",
      });
  }
});

/**
 * Handles GET requests.
 * Fetches the full details of a single product or bundle by its ID.
 */
async function getProductHandler({
  client,
  productId,
}: Omit<HandlerParams, "event">) {
  const { data: product, error } = await client
    .from("products")
    .select("*, category:categories(*)")
    .eq("id", productId)
    .single();

  if (product) return { ...product, type: "product" };

  const { data: bundle } = await client
    .from("bundles")
    .select("*, category:categories(*)")
    .eq("id", productId)
    .single();

  if (bundle) return { ...bundle, type: "bundle" };

  if (error && error.code !== "PGRST116") {
    // PGRST116 means "no rows found"
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  throw createError({
    statusCode: 404,
    statusMessage: "Product or Bundle not found",
  });
}

/**
 * Handles PUT requests.
 * Updates a product or bundle with the provided data.
 */
async function updateProductHandler({
  client,
  productId,
  event,
}: HandlerParams) {
  // Use the new payload type here
  const body = await readBody<ProductUpdatePayload>(event);
  const tableName = body.type === "bundle" ? "bundles" : "products";

  const allowedUpdates = [
    "name",
    "slug",
    "description",
    "price",
    "stock",
    "is_active",
    "is_best_seller",
    "images",
    "category_id", // Add 'category_id' to the list of allowed updates
    "unit",
    "size",
    "min_purchase",
    "bpom_number",
    "sku_id",
    "weight_gr",
    "length_cm",
    "width_cm",
    "height_cm",
  ];

  const updateData: { [key: string]: any } = {};
  for (const key of allowedUpdates) {
    // We need to check both body types here
    if ((body as any)[key] !== undefined) {
      updateData[key] = (body as any)[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No valid fields provided for update.",
    });
  }

  const { data, error } = await client
    .from(tableName)
    .update(updateData)
    .eq("id", productId)
    .select()
    .single();

  if (error)
    throw createError({ statusCode: 500, statusMessage: error.message });
  return data;
}

/**
 * Handles DELETE requests.
 * Deletes a product or bundle.
 */
async function deleteProductHandler({
  client,
  productId,
  event,
}: HandlerParams) {
  const body = await readBody(event);
  const tableName = body.type === "bundle" ? "bundles" : "products";

  const { error } = await client.from(tableName).delete().eq("id", productId);
  if (error)
    throw createError({ statusCode: 500, statusMessage: error.message });

  event.node.res.statusCode = 204; // Standard successful DELETE response
  return; // No body content needed for a 204 response
}
