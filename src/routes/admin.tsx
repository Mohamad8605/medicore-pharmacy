import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { ContactTab } from "@/components/admin/ContactTab";
import { MedicationsTab } from "@/components/admin/MedicationsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { LayoutDashboard, Settings, Mail, Pill, Users } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Dashboard" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isStaff, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
    if (!authLoading && user && !isStaff) navigate({ to: "/" });
  }, [authLoading, user, isStaff, navigate]);

  if (authLoading || !user) {
    if (authLoading) {
      return (
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <Skeleton className="h-8 w-48 sm:w-64" />
          <div className="mt-6 space-y-4">
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-32 rounded-md" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      );
    }
    return null;
  }
  if (!isStaff) return null;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold break-words">
        {isAdmin ? "Admin" : "Pharmacist"} dashboard
      </h1>
      <p className="mt-1 text-sm sm:text-base text-muted-foreground">
        {isAdmin
          ? "Manage orders, medications, contact messages and user roles."
          : "Manage orders, medications and contact messages."}
      </p>

      <Tabs defaultValue="orders" className="mt-4 sm:mt-6">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start sm:justify-start">
          <TabsTrigger value="orders" className="gap-1 sm:gap-2 px-2 sm:px-4">
            <LayoutDashboard className="h-4 w-4 shrink-0" />{" "}
            <span className="hidden sm:inline">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-1 sm:gap-2 px-2 sm:px-4">
            <Mail className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
          <TabsTrigger value="medications" className="gap-1 sm:gap-2 px-2 sm:px-4">
            <Pill className="h-4 w-4 shrink-0" />{" "}
            <span className="hidden sm:inline">Medications</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1 sm:gap-2 px-2 sm:px-4">
            <Settings className="h-4 w-4 shrink-0" />{" "}
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="gap-1 sm:gap-2 px-2 sm:px-4">
              <Users className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <OrdersTab />
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <ContactTab />
        </TabsContent>

        <TabsContent value="medications" className="mt-6">
          <MedicationsTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
