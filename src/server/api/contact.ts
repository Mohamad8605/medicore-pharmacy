import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireStaffRole } from "./auth-helpers";

type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};
export const submitContactMessage = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { name, email, subject, message } = ctx.data as unknown as ContactInput;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return { error: "All fields are required" };
  }

  const { error } = await supabaseAdmin.from("contact_messages").insert({
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
  });
  if (error) return { error: error.message };
  return { error: null };
});

export const getContactMessages = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaffRole();
  const { data, error } = await supabaseAdmin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});
