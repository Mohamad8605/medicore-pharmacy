import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Mohamad's MediCore Pharmacy GmbH online" },
      {
        name: "description",
        content:
          "Privacy policy for Mohamad's MediCore Pharmacy GmbH online. Learn how we protect your personal data.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-16">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">
        Privacy Policy
      </h1>
      <div className="mx-auto max-w-3xl mt-8 space-y-6 text-sm sm:text-base leading-relaxed text-muted-foreground break-words hyphens-auto">
        <p>
          Mohamad's MediCore Pharmacy GmbH online takes your privacy seriously. This policy explains
          how we collect, use, and protect your personal data when you use our pharmacy web
          application.
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Data Collection</h2>
        <p>
          We collect personal information that you provide to us when placing an order, creating an
          account, or contacting our pharmacy team. This includes name, delivery address, email,
          phone number, and prescription details.
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">How We Use Your Data</h2>
        <p>
          Your data is used solely for processing orders, verifying prescriptions, and improving our
          service. We never share your medical information with third parties without your explicit
          consent.
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Data Storage & Security
        </h2>
        <p>
          All data is stored on encrypted servers within the EU. Prescription files are stored in
          private, access-controlled storage buckets and are only visible to verified pharmacy
          staff.
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal data at any time. Contact
          us at support@mohamads-medicore-pharmacy.de for any data-related requests.
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Cookies</h2>
        <p>
          We use essential cookies for authentication and cart functionality. Analytics cookies are
          only used with your consent. You can manage cookie preferences at any time.
        </p>
      </div>
    </div>
  );
}
