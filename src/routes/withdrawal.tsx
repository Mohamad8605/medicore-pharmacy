import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/withdrawal")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
