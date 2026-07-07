import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

const DEMO_KEY = "demo_session";
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      return next({
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(DEMO_KEY) : null;
    if (raw) {
      return next({
        headers: { Authorization: `Demo ${raw}` },
      });
    }
    return next({});
  },
);
