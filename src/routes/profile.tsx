import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchProfile, updateProfile } from "@/lib/profile-service";

const profileSchema = z.object({
  first_name: z.string().trim().min(1).max(60),
  last_name: z.string().trim().min(1).max(60),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  street: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  postcode: z.string().trim().max(20).optional().or(z.literal("")),
});

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Mohamad's MediCore Pharmacy GmbH online" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading, roles } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    street: "",
    city: "",
    postcode: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchProfile()
      .then((data) => {
        if (data)
          setP({
            first_name: data.first_name ?? "",
            last_name: data.last_name ?? "",
            phone: data.phone ?? "",
            street: data.street ?? "",
            city: data.city ?? "",
            postcode: data.postcode ?? "",
          });
      })
      .catch(() => toast.error("Could not load profile"));
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = profileSchema.safeParse(p);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    setSaving(true);
    const { error } = await updateProfile(p);
    setSaving(false);
    if (error) toast.error(error);
    else toast.success("Profile updated");
  }

  if (!user) return null;
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold break-words hyphens-auto">My profile</h1>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words hyphens-auto">
        {user.email} · {roles.join(", ") || "patient"}
      </p>
      <Card className="mt-4 sm:mt-6 rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  value={p.first_name}
                  onChange={(e) => setP({ ...p, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  value={p.last_name}
                  onChange={(e) => setP({ ...p, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={p.phone}
                onChange={(e) => setP({ ...p, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                value={p.street}
                onChange={(e) => setP({ ...p, street: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={p.city}
                  onChange={(e) => setP({ ...p, city: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={p.postcode}
                  onChange={(e) => setP({ ...p, postcode: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
