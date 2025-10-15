import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database } from "~~/app/types/database";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user)
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  const client = await serverSupabaseClient<Database>(event);

  // --- Handle GET requests to fetch all tickets for the user ---
  if (event.method === "GET") {
    const { data, error } = await client
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false }); // Show newest first

    if (error)
      throw createError({ statusCode: 500, statusMessage: error.message });
    return data;
  }

  // --- Handle POST requests to create a new ticket ---
  if (event.method === "POST") {
    const body = await readBody(event);
    const { error } = await client.from("tickets").insert({
      user_id: user.id,
      issue_type: body.issueType,
      description: body.description,
      transaction_reference: body.transactionReference,
      contact_phone: body.phone,
      contact_email: body.email,
      supporting_files: body.supportingFiles,
    });

    if (error)
      throw createError({ statusCode: 500, statusMessage: error.message });
    return { status: 201, message: "Ticket created successfully" };
  }
});
