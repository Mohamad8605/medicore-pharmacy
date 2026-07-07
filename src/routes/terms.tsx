import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Mohamad's MediCore Pharmacy GmbH online" },
      {
        name: "description",
        content:
          "Terms and conditions for using Mohamad's MediCore Pharmacy GmbH online. Please read carefully before placing an order.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-16">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">
        Terms & Conditions
      </h1>
      <div className="mx-auto max-w-3xl mt-8 space-y-6 text-sm sm:text-base leading-relaxed text-muted-foreground break-words hyphens-auto">
        <p>
          Welcome to Mohamad's MediCore Pharmacy GmbH online. By accessing or using our web
          application, you agree to be bound by these terms and conditions. Please read them
          carefully before placing an order.
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">General</h2>
        <p>
          These terms govern your use of the Mohamad's MediCore Pharmacy GmbH online platform. By
          placing an order, you agree to be bound by these terms. If you do not agree, please
          refrain from using our service.
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Orders & Prescriptions
        </h2>
        <p>
          Prescription medication can only be dispatched after a registered pharmacist has reviewed
          and approved your uploaded prescription. We reserve the right to decline or cancel any
          order that does not meet regulatory requirements.
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Pricing & Payments</h2>
        <p>
          All prices are displayed in Euros (€) and include VAT unless stated otherwise. Payment is
          due at the time of order. We accept the payment methods listed at checkout.
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Delivery</h2>
        <p>
          Delivery times are estimates and not guaranteed. We are not liable for delays caused by
          third-party carriers or circumstances beyond our control.
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Limitation of Liability
        </h2>
        <p>
          Our liability is limited to the value of the order. We are not liable for indirect damages
          or losses arising from the use of our platform.
        </p>
      </div>
    </div>
  );
}
