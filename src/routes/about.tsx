import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShieldCheck, Users, Award } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Mohamad's MediCore Pharmacy GmbH online" },
      {
        name: "description",
        content:
          "Learn how Mohamad's MediCore Pharmacy GmbH online combines local pharmacy expertise with a modern online ordering experience.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Patient first",
      desc: "Every feature is designed around making medication access easier and safer.",
    },
    {
      icon: ShieldCheck,
      title: "Safety & privacy",
      desc: "Prescriptions are stored in a private bucket and only visible to verified pharmacists.",
    },
    {
      icon: Users,
      title: "Local expertise",
      desc: "Our pharmacists review every prescription order before it leaves the dispensary.",
    },
    {
      icon: Award,
      title: "Quality service",
      desc: "Transparent pricing, real-time order tracking and same-day pickup where possible.",
    },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">
          About Mohamad's MediCore Pharmacy GmbH online
        </h1>
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground break-words hyphens-auto">
          Mohamad's MediCore Pharmacy GmbH online was built to bridge the gap between trusted local
          pharmacy care and modern, on-demand digital services. We help patients order their
          medication, upload prescriptions and track every step of the fulfilment process — all from
          one secure platform.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v) => (
          <Card key={v.title} className="border-border/60">
            <CardContent className="p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground break-words hyphens-auto">
                {v.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 rounded-2xl bg-secondary/40 p-6 sm:p-10 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Our mission</h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground break-words hyphens-auto">
            Make safe, regulated medication accessible to everyone — without the queue. We pair a
            friendly digital experience with the clinical oversight of registered pharmacists, so
            patients always get the right product at the right time.
          </p>
          <Link to="/medications" className="mt-6 inline-block">
            <Button>Browse medications</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-primary break-words">12+</p>
            <p className="text-xs text-muted-foreground">Medication categories</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-primary break-words">100%</p>
            <p className="text-xs text-muted-foreground">Pharmacist reviewed</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-primary break-words">24/7</p>
            <p className="text-xs text-muted-foreground">Online ordering</p>
          </div>
        </div>
      </div>
    </div>
  );
}
