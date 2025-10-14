// server/api/admin/products/[id].ts
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/app/types/database";

export default defineEventHandler(async (event) => {
  if (event.method !== "PUT") {
    throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
  }

  const client = await serverSupabaseClient<Database>(event);
  const productId = parseInt(event.context.params!.id);
  const body = await readBody(event);

  if (isNaN(productId)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid Product ID" });
  }

  const tableName = body.type === "bundle" ? "bundles" : "products";

  // Build an object with only the fields provided in the request body.
  // This makes the endpoint flexible for various types of updates.
  const updateData: { [key: string]: unknown } = {};
  if (body.price !== undefined) updateData.price = body.price;
  if (body.stock !== undefined) updateData.stock = body.stock;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;
  if (body.is_best_seller !== undefined)
    updateData.is_best_seller = body.is_best_seller;

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No update data provided",
    });
  }

  const { data, error } = await client
    .from(tableName)
    .update(updateData)
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data;
});
