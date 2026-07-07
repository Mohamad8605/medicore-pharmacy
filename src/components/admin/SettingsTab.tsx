import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import {
  getConfirmationSetting,
  toggleConfirmation,
  getAllSettings,
  updateSetting,
} from "@/lib/admin-service";

type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

type HoursRecord = {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
};

const defaultHours: HoursRecord = {
  monday: { open: "08:00", close: "20:00", closed: false },
  tuesday: { open: "08:00", close: "20:00", closed: false },
  wednesday: { open: "08:00", close: "20:00", closed: false },
  thursday: { open: "08:00", close: "20:00", closed: false },
  friday: { open: "08:00", close: "20:00", closed: false },
  saturday: { open: "09:00", close: "18:00", closed: false },
  sunday: { open: "10:00", close: "16:00", closed: true },
};

const dayLabels: Record<keyof HoursRecord, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [requireConfirmation, setRequireConfirmation] = useState(true);
  const [confirmationLoaded, setConfirmationLoaded] = useState(false);

  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  const [deliveryFee, setDeliveryFee] = useState(4.9);
  const [freeShippingMin, setFreeShippingMin] = useState(50);
  const [estimatedDays, setEstimatedDays] = useState(3);

  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState("info");

  const [hours, setHours] = useState<HoursRecord>(defaultHours);

  useEffect(() => {
    Promise.all([
      getConfirmationSetting()
        .then((v) => {
          setRequireConfirmation(v);
          setConfirmationLoaded(true);
        })
        .catch(() => setConfirmationLoaded(true)),
      getAllSettings()
        .then((settings) => {
          if (settings.low_stock_threshold !== undefined)
            setLowStockThreshold(Number(settings.low_stock_threshold));
          if (settings.delivery_fee !== undefined) setDeliveryFee(Number(settings.delivery_fee));
          if (settings.free_shipping_minimum !== undefined)
            setFreeShippingMin(Number(settings.free_shipping_minimum));
          if (settings.estimated_delivery_days !== undefined)
            setEstimatedDays(Number(settings.estimated_delivery_days));
          if (settings.announcement_enabled !== undefined)
            setAnnouncementEnabled(Boolean(settings.announcement_enabled));
          if (settings.announcement_message !== undefined)
            setAnnouncementMessage(String(settings.announcement_message));
          if (settings.announcement_type !== undefined)
            setAnnouncementType(String(settings.announcement_type));
          if (settings.pharmacy_hours !== undefined) {
            try {
              const h =
                typeof settings.pharmacy_hours === "string"
                  ? JSON.parse(settings.pharmacy_hours as string)
                  : settings.pharmacy_hours;
              setHours({ ...defaultHours, ...h });
            } catch {
              /* use defaults */
            }
          }
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function saveConfirmation(checked: boolean) {
    setRequireConfirmation(checked);
    try {
      await toggleConfirmation(checked);
      toast.success("Email confirmation " + (checked ? "enabled" : "disabled"));
    } catch {
      toast.error("Failed to save email confirmation setting");
      setRequireConfirmation(!checked);
    }
  }

  async function saveSetting(key: string, value: Json) {
    setSavingKey(key);
    try {
      await updateSetting(key, value);
      toast.success("Setting saved");
    } catch {
      toast.error("Failed to save setting");
    }
    setSavingKey(null);
  }

  async function saveHours() {
    setSavingKey("pharmacy_hours");
    try {
      await updateSetting("pharmacy_hours", JSON.stringify(hours));
      toast.success("Opening hours saved");
    } catch {
      toast.error("Failed to save opening hours");
    }
    setSavingKey(null);
  }

  function updateDay(day: keyof HoursRecord, field: keyof DayHours, value: string | boolean) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>&nbsp;</CardTitle>
            </CardHeader>
            <CardContent className="h-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="email-confirmation" className="text-base font-medium">
                Require email confirmation
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, new users must verify their email before they can sign in.
              </p>
            </div>
            <Switch
              id="email-confirmation"
              checked={requireConfirmation}
              onCheckedChange={saveConfirmation}
              disabled={!confirmationLoaded}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Low stock threshold</CardTitle>
          <Button
            size="sm"
            onClick={() => saveSetting("low_stock_threshold", lowStockThreshold)}
            disabled={savingKey === "low_stock_threshold"}
          >
            {savingKey === "low_stock_threshold" ? "Saving…" : "Save"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="low-stock" className="text-base font-medium">
                Minimum stock threshold
              </Label>
              <p className="text-sm text-muted-foreground">
                Medications with stock at or below this number get a low-stock warning in the
                medications view.
              </p>
            </div>
            <Input
              id="low-stock"
              type="number"
              min={0}
              className="w-20"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Shipping settings</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              saveSetting("delivery_fee", deliveryFee);
              saveSetting("free_shipping_minimum", freeShippingMin);
              saveSetting("estimated_delivery_days", estimatedDays);
            }}
            disabled={savingKey === "shipping"}
          >
            {savingKey === "shipping" ? "Saving…" : "Save all"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="delivery-fee" className="text-base font-medium">
                Delivery fee (EUR)
              </Label>
              <p className="text-sm text-muted-foreground">Flat rate charged per order.</p>
            </div>
            <Input
              id="delivery-fee"
              type="number"
              min={0}
              step="0.01"
              className="w-24"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="free-shipping" className="text-base font-medium">
                Free shipping minimum (EUR)
              </Label>
              <p className="text-sm text-muted-foreground">
                Orders at or above this amount get free delivery.
              </p>
            </div>
            <Input
              id="free-shipping"
              type="number"
              min={0}
              step="0.01"
              className="w-24"
              value={freeShippingMin}
              onChange={(e) => setFreeShippingMin(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="est-days" className="text-base font-medium">
                Estimated delivery days
              </Label>
              <p className="text-sm text-muted-foreground">
                Typical number of business days for delivery.
              </p>
            </div>
            <Input
              id="est-days"
              type="number"
              min={1}
              className="w-20"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(parseInt(e.target.value) || 1)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Announcement banner</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              saveSetting("announcement_enabled", announcementEnabled);
              saveSetting("announcement_message", announcementMessage);
              saveSetting("announcement_type", announcementType);
            }}
            disabled={savingKey === "announcement"}
          >
            {savingKey === "announcement" ? "Saving…" : "Save"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="announcement-toggle" className="text-base font-medium">
                Show announcement banner
              </Label>
              <p className="text-sm text-muted-foreground">
                Display a banner at the top of every page.
              </p>
            </div>
            <Switch
              id="announcement-toggle"
              checked={announcementEnabled}
              onCheckedChange={setAnnouncementEnabled}
            />
          </div>
          {announcementEnabled && (
            <>
              <div className="rounded-lg border p-4 space-y-2">
                <Label htmlFor="announcement-message">Message</Label>
                <Input
                  id="announcement-message"
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="e.g. Delivery delays due to public holiday on June 15"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="announcement-type" className="text-base font-medium">
                  Banner type
                </Label>
                <Select value={announcementType} onValueChange={setAnnouncementType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Opening hours</CardTitle>
          <Button size="sm" onClick={saveHours} disabled={savingKey === "pharmacy_hours"}>
            {savingKey === "pharmacy_hours" ? "Saving…" : "Save hours"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(Object.keys(dayLabels) as (keyof HoursRecord)[]).map((day) => {
              const d = hours[day];
              return (
                <div key={day} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                  <span className="w-24 sm:w-28 text-sm font-medium capitalize">
                    {dayLabels[day]}
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`${day}-closed`}
                      checked={!d.closed}
                      onCheckedChange={(v) => updateDay(day, "closed", !v)}
                    />
                    <Label htmlFor={`${day}-closed`} className="text-xs text-muted-foreground">
                      {d.closed ? "Closed" : "Open"}
                    </Label>
                  </div>
                  {!d.closed && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        className="w-28"
                        value={d.open}
                        onChange={(e) => updateDay(day, "open", e.target.value)}
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="time"
                        className="w-28"
                        value={d.close}
                        onChange={(e) => updateDay(day, "close", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
