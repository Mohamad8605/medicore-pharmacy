import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/medications")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Medications — Mohamad's MediCore Pharmacy GmbH online" }] }),
  component: MedicationsLayout,
});

function MedicationsLayout() {
  return <Outlet />;
}
