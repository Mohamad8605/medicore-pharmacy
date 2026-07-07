import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — Mohamad's MediCore Pharmacy GmbH online" }] }),
  component: OrdersLayout,
});

function OrdersLayout() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  if (!user) return null;
  return <Outlet />;
}
