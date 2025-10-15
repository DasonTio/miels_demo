import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database } from "~~/app/types/database";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user)
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  const client = await serverSupabaseClient<Database>(event);
  const ticketId = parseInt(event.context.params!.id);

  if (isNaN(ticketId)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid Ticket ID" });
  }

  // --- Handle PUT requests to update the status ---
  if (event.method === "PUT") {
    const body = await readBody(event);
    const { error } = await client
      .from("tickets")
      .update({
        status: body.status,
        resolved_at:
          body.status === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", ticketId)
      .eq("user_id", user.id); // Extra security: ensure user owns the ticket

    if (error)
      throw createError({ statusCode: 500, statusMessage: error.message });
    return { status: 200, message: "Ticket updated successfully" };
  }
});
