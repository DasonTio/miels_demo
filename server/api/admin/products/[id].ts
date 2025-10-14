// server/api/admin/products/[id].ts
import { serverSupabaseClient } from "#supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~~/app/types/database";

type HandlerParams = {
  productId: number;
  client: SupabaseClient;
  body: { [key: string]: unknown };
};

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const productId = parseInt(event.context.params!.id);

  if (isNaN(productId))
    throw createError({ statusCode: 400, statusMessage: "Invalid Product ID" });

  const body = await readBody(event);
  const params = { client, body, productId };

  switch (event.method) {
    case "PUT":
      return putEventHandler(params);
    case "DELETE":
      return deleteEventHandler(params);
  }

  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

async function putEventHandler({ client, body, productId }: HandlerParams) {
  const tableName = body.type === "bundle" ? "bundles" : "products";
  const { data, error } = await client
    .from(tableName)
    .update({
      price: body.price,
      stock: body.stock,
      is_active: body.is_active,
      is_best_seller: body.is_best_seller,
    })
    .eq("id", productId)
    .select()
    .single();
  if (error)
    throw createError({ statusCode: 500, statusMessage: error.message });
  return data;
}

async function deleteEventHandler({ client, body, productId }: HandlerParams) {
  const tableName = body.type === "bundle" ? "bundles" : "products";
  const { error } = await client.from(tableName).delete().eq("id", productId);
  if (error)
    throw createError({ statusCode: 500, statusMessage: error.message });
  return { status: 204, message: "Deleted successfully" };
}
