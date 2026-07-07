import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { submitContactMessage } from "@/lib/contact-service";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Mohamad's MediCore Pharmacy GmbH online" },
      {
        name: "description",
        content: "Get in touch with the Mohamad's MediCore Pharmacy GmbH online pharmacy team.",
      },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(4000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await submitContactMessage(parsed.data);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Thanks — we'll be in touch shortly.");
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">
          Get in touch
        </h1>
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground">
          Questions about an order, a prescription or our service? Send us a message and a
          pharmacist will get back to you.
        </p>
      </div>

      <div className="mx-auto mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Mail className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm leading-relaxed text-muted-foreground break-words hyphens-auto">
                  support@mohamads-medicore-pharmacy.de
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Phone className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm leading-relaxed text-muted-foreground">+49 30 98765432</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <MapPin className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-sm leading-relaxed text-muted-foreground break-words hyphens-auto">
                  Apothekenstraße 12
                  <br />
                  10115 Berlin
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Clock className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Hours</p>
                <p className="text-sm leading-relaxed text-muted-foreground break-words hyphens-auto">
                  Mon–Sat 9:00–19:00
                  <br />
                  Sun 10:00–16:00
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={120}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={255}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  maxLength={4000}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
