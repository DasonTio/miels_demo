/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database } from "~~/app/types/database";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user)
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  const client = await serverSupabaseClient<Database>(event);
  const { items, totalPrice } = await readBody(event);

  // 1. Create the main order record
  const { data: order, error: orderError } = await client
    .from("orders")
    .insert({ user_id: user.sub, total_price: totalPrice })
    .select()
    .single();

  if (orderError)
    throw createError({ statusCode: 500, statusMessage: orderError.message });

  // 2. Prepare the items for that order
  const orderItems = items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product.id,
    quantity: item.quantity,
    price_at_purchase: item.product.price,
  }));

  // 3. Insert all order items
  const { error: itemsError } = await client
    .from("order_items")
    .insert(orderItems);

  if (itemsError)
    throw createError({ statusCode: 500, statusMessage: itemsError.message });

  return { orderId: order.id, orderNumber: order.order_number };
});
