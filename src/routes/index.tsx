import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Truck,
  Clock,
  Pill,
  Stethoscope,
  HeartPulse,
  Baby,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ProductGrid } from "@/components/ProductGrid";
import { ERezeptScanner } from "@/components/ERezeptScanner";
import { PrescriptionUploadDialog } from "@/components/PrescriptionUploadDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mohamad's MediCore Pharmacy GmbH online — Trusted Online Pharmacy" },
      {
        name: "description",
        content:
          "Order prescription and over-the-counter medicines online. Upload your prescription, fast delivery, and personal pharmacist support.",
      },
    ],
  }),
  component: Index,
});

const categories = [
  { icon: Pill, label: "Pain & Fever" },
  { icon: HeartPulse, label: "Cold & Flu" },
  { icon: Baby, label: "Mother & Baby" },
  { icon: Stethoscope, label: "Skin & Wound Care" },
];

const trustPoints = [
  { icon: ShieldCheck, label: "Registered Pharmacy", sub: "Fully licensed & regulated" },
  { icon: Truck, label: "Fast Delivery", sub: "Free over €25 · 1–3 working days" },
  { icon: Clock, label: "Pharmacist Support", sub: "Mon–Sat, real human advice" },
];

function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", replace: true });
  }, [authLoading, user, navigate]);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.07] to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs sm:text-sm font-medium text-primary shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Your pharmacy &middot; online & on-site
            </span>
            <h1 className="mt-4 sm:mt-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Order medicines with confidence.
              <br />
              <span className="text-primary">Upload your prescription in seconds.</span>
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              A modern online pharmacy: over-the-counter products, secure prescription upload, and
              personal pharmacist support &mdash; all in one calm, clear interface.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/medications" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-xl gap-2 text-sm sm:text-base px-6 py-3 h-auto"
                >
                  Browse medicines <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-xl text-sm sm:text-base px-6 py-3 h-auto"
                onClick={() => setUploadOpen(true)}
              >
                Upload prescription
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {trustPoints.map((t) => (
              <div
                key={t.label}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-3 rounded-2xl border bg-card p-5 sm:p-5 text-center sm:text-left shadow-sm"
              >
                <span className="grid h-10 w-10 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <t.icon className="h-5 w-5 sm:h-4 sm:w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((c) => (
              <Link
                key={c.label}
                to="/medications"
                search={{ category: c.label }}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-5 sm:p-6 text-center transition-all hover:border-primary/30 hover:shadow-md"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <c.icon className="h-6 w-6" />
                </span>
                <div>
                  <span className="font-semibold text-sm sm:text-base leading-tight block">
                    {c.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <ERezeptScanner />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <ProductGrid />
      </section>

      <section className="border-t bg-gradient-to-r from-primary/[0.03] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm sm:text-base font-semibold">Pharmacist-reviewed safety</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Every prescription medicine is reviewed by a registered pharmacist before it leaves
                our dispensary.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm sm:text-base font-semibold">Transparent pricing</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                All prices include VAT with no hidden fees. Free delivery on orders over &euro;25.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm sm:text-base font-semibold">GDPR-grade privacy</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Your health data stays encrypted. We never share it with third parties &mdash; all
                data is stored on EU servers.
              </p>
            </div>
          </div>
        </div>
      </section>
      <PrescriptionUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </>
  );
}
