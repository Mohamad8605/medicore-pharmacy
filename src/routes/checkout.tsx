import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useFormatPrice } from "@/hooks/use-format-price";
import { SHIPPING_FEE, SHIPPING_THRESHOLD } from "@/lib/constants";
import { fetchProfile } from "@/lib/profile-service";
import {
  createOrder,
  createOrderItems,
  updateOrder,
  uploadPrescription,
  validateStock,
} from "@/lib/order-service";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Mohamad's MediCore Pharmacy GmbH online" }] }),
  validateSearch: (search: Record<string, unknown>) => search as { editOrderId?: string },
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, total, needsPrescription, clear } = useCart();
  const { user, loading: authLoading, isDemo } = useAuth();
  const navigate = useNavigate();
  const { editOrderId } = Route.useSearch();
  const fp = useFormatPrice();
  // console.log("editOrderId from search:", editOrderId);
  const [method, setMethod] = useState<"pickup" | "delivery">("pickup");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [useDemoPrescription, setUseDemoPrescription] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const justPlaced = useRef(false);
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
    if (!authLoading && items.length === 0 && !justPlaced.current) navigate({ to: "/cart" });
  }, [authLoading, user, items.length, navigate]);

  useEffect(() => {
    if (user)
      fetchProfile()
        .then((data) => {
          if (data) {
            setStreet(data.street ?? "");
            setCity(data.city ?? "");
            setPostcode(data.postcode ?? "");
          }
        })
        .catch(() => {});
  }, [user]);

  const grandTotal = total() + (method === "delivery" ? SHIPPING_FEE : 0);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("File must be under 5MB");
    if (!["image/jpeg", "image/png", "application/pdf"].includes(f.type))
      return toast.error("Only JPG, PNG or PDF allowed");
    setFile(f);
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!editOrderId && needsPrescription() && !file && !useDemoPrescription)
      return toast.error("Upload your prescription");
    if (method === "delivery" && (!street || !city || !postcode))
      return toast.error("Fill in delivery address");
    setSubmitting(true);
    try {
      let prescriptionPath: string | null = null;
      if (editOrderId) {
        // keep existing prescription
      } else if (useDemoPrescription) {
        prescriptionPath = "demo/prescription.jpg";
      } else if (file) {
        const { path, error } = await uploadPrescription(file);
        if (error) throw new Error(error);
        prescriptionPath = path;
      }

      if (editOrderId) {
        await updateOrder({
          orderId: editOrderId,
          items: items.map((i) => ({
            medication_id: i.medication.id,
            quantity: i.quantity,
            unit_price: i.medication.price,
          })),
          total_price: grandTotal,
          delivery_method: method,
          street: method === "delivery" ? street : null,
          city: method === "delivery" ? city : null,
          postcode: method === "delivery" ? postcode : null,
          notes: notes || null,
        });
        justPlaced.current = true;
        clear();
        toast.success("Order updated!");
        navigate({ to: "/orders/$id", params: { id: editOrderId } });
      } else {
        await validateStock(
          items.map((i) => ({
            medication_id: i.medication.id,
            quantity: i.quantity,
          })),
        );

        const order = await createOrder({
          total_price: grandTotal,
          delivery_method: method,
          street: method === "delivery" ? street : null,
          city: method === "delivery" ? city : null,
          postcode: method === "delivery" ? postcode : null,
          notes: notes || null,
          prescription_path: prescriptionPath,
        });
        await createOrderItems(
          items.map((i) => ({
            order_id: order.id,
            medication_id: i.medication.id,
            quantity: i.quantity,
            unit_price: i.medication.price,
          })),
        );
        justPlaced.current = true;
        clear();
        toast.success("Order placed!");
        navigate({ to: "/orders/$id", params: { id: order.id } });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : err instanceof Response
              ? `Server ${err.status}`
              : JSON.stringify(err);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold break-words">
        {editOrderId ? "Edit order" : "Checkout"}
      </h1>
      <form
        onSubmit={placeOrder}
        className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3"
      >
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Delivery method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={method}
                onValueChange={(v) => setMethod(v as "pickup" | "delivery")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup">Pickup (free)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Home delivery (€{SHIPPING_FEE})</Label>
                </div>
              </RadioGroup>
              {method === "delivery" && (
                <div className="mt-4 grid gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="street">Street</Label>
                    <Input
                      id="street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          {needsPrescription() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" /> Prescription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label>Upload (JPG, PNG, PDF — max 5MB)</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFile}
                  className="mt-2"
                  disabled={useDemoPrescription}
                />
                {file && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-primary">
                    <CheckCircle2 className="h-4 w-4" /> {file.name}
                  </p>
                )}
                {isDemo && (
                  <Button
                    type="button"
                    variant={useDemoPrescription ? "default" : "outline"}
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setUseDemoPrescription((v) => !v);
                      if (!useDemoPrescription) setFile(null);
                    }}
                  >
                    {useDemoPrescription ? "Using demo prescription" : "Use demo prescription"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {items.map((i) => (
              <div key={i.medication.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground break-words flex-1 min-w-0">
                  {i.medication.name} × {i.quantity}
                </span>
                <span className="shrink-0">{fp(i.medication.price * i.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between">
              <span>Subtotal</span>
              <span>{fp(total())}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{method === "pickup" ? "FREE" : `€${SHIPPING_FEE}`}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">{fp(grandTotal)}</span>
            </div>
            <Button type="submit" className="w-full mt-2" size="lg" disabled={submitting}>
              {submitting
                ? editOrderId
                  ? "Updating…"
                  : "Placing…"
                : editOrderId
                  ? "Update order"
                  : "Place order"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
