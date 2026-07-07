import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Mohamad's MediCore Pharmacy GmbH online" },
      {
        name: "description",
        content: "Answers to common questions about ordering, prescriptions, delivery and payment.",
      },
    ],
  }),
  component: FaqPage,
});

const faqs = [
  {
    q: "How do I order prescription medication?",
    a: "Add the prescription item to your cart, then upload a clear photo of your prescription during checkout. A pharmacist reviews it before the order is dispatched.",
  },
  {
    q: "How long does an order take?",
    a: "Pickup orders are usually ready the same day. Home delivery typically arrives within 1–3 working days depending on your PLZ.",
  },
  {
    q: "Is my personal data safe?",
    a: "Yes. Prescriptions are stored in a private file bucket and only accessible to verified pharmacy staff. Your account data is protected by row-level security.",
  },
  {
    q: "Can I track my order?",
    a: "Yes. Open “My Orders” from the navigation bar to see real-time status updates from received to ready.",
  },
  {
    q: "Which payment methods do you support?",
    a: "The current prototype simulates payment at checkout. A production deployment would integrate Stripe or another regulated payment processor.",
  },
  {
    q: "Can I cancel an order?",
    a: "Orders can be cancelled by contacting the pharmacy team while the status is still pending or confirmed.",
  },
];

function FaqPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-16">
      <h1 className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">
        Frequently asked questions
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm sm:text-base leading-relaxed text-muted-foreground">
        Can't find what you're looking for?{" "}
        <Link to="/contact" className="text-primary underline">
          Contact us
        </Link>
        .
      </p>
      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`i-${i}`} className="px-4 sm:px-0">
              <AccordionTrigger className="text-left text-sm sm:text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base leading-relaxed break-words hyphens-auto">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <div className="mt-12 text-center">
        <Link to="/medications">
          <Button>Browse medications</Button>
        </Link>
      </div>
    </div>
  );
}
