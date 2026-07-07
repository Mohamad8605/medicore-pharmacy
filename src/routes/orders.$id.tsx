import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Clock, Edit, Trash2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useFormatPrice } from "@/hooks/use-format-price";
import { useCart } from "@/lib/cart";
import {
  fetchOrderById,
  getPrescriptionSignedUrl,
  cancelOrder,
  deleteOrder,
  getMedicationsByIds,
} from "@/lib/order-service";

type OrderItem = {
  quantity: number;
  unit_price: number;
  medication_id?: string;
  medications: { name: string } | null;
};

type OrderDetail = {
  id: string;
  total_price: number;
  status: string;
  delivery_method: string;
  street: string | null;
  city: string | null;
  postcode: string | null;
  notes: string | null;
  pharmacist_notes: string | null;
  prescription_path: string | null;
  created_at: string;
  order_items: OrderItem[];
};

export const Route = createFileRoute("/orders/$id")({ component: OrderDetailPage });

const STEPS = [
  { key: "pending", label: "Order received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_preparation", label: "In preparation" },
  { key: "ready", label: "Ready for pickup/delivery" },
  { key: "completed", label: "Completed" },
];

function OrderDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fp = useFormatPrice();

  async function handleEdit() {
    if (!order) return;
    const medIds = order.order_items
      .map((it) => (it as OrderItem & { medication_id?: string }).medication_id)
      .filter(Boolean) as string[];
    try {
      const meds = await getMedicationsByIds(medIds);
      const cart = useCart.getState();
      cart.clear();
      for (const item of order.order_items) {
        const medId = (item as OrderItem & { medication_id?: string }).medication_id;
        const med = meds.find((m) => m.id === medId);
        if (med) {
          const cartMed = {
            id: med.id,
            name: med.name,
            price: Number(med.price),
            stock: med.stock,
            image_url: med.image_url,
            requires_prescription: med.requires_prescription,
          };
          cart.add(cartMed, item.quantity);
        }
      }
      navigate({ to: "/checkout", search: { editOrderId: order.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load medications");
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await cancelOrder(id);
      setOrder((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this cancelled order permanently?")) return;
    setDeleting(true);
    try {
      await deleteOrder(id);
      toast.success("Order deleted");
      navigate({ to: "/orders" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete order");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    fetchOrderById(id)
      .then(async (data) => {
        if (!data) {
          toast.error("Order not found");
          return;
        }
        const orderData = data as unknown as OrderDetail;
        setOrder(orderData);

        if (orderData.prescription_path) {
          const url = await getPrescriptionSignedUrl(orderData.prescription_path);
          setSignedUrl(url);
        }
      })
      .catch(() => toast.error("Failed to load order details"));
  }, [id]);

  if (!order)
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="mt-4 h-10 w-48" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          </div>
          <Card className="h-fit">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-20" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  const idx = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link to="/orders">
        <Button variant="outline" className="h-9 sm:h-10 text-xs sm:text-sm">
          <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Back
        </Button>
      </Link>
      <h1 className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-bold">Order details</h1>
      <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="block sm:hidden space-y-3">
                {order.order_items.map((it: OrderItem, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{it.medications?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {it.quantity} x {fp(Number(it.unit_price))}
                      </p>
                    </div>
                    <p className="font-semibold">{fp(it.quantity * Number(it.unit_price))}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <p className="font-semibold">Total</p>
                  <p className="font-bold text-primary">{fp(Number(order.total_price))}</p>
                </div>
              </div>
              <table className="hidden sm:table w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">Medication</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items.map((it: OrderItem, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{it.medications?.name}</td>
                      <td>{it.quantity}</td>
                      <td>{fp(Number(it.unit_price))}</td>
                      <td className="text-right">{fp(it.quantity * Number(it.unit_price))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-3 text-right font-semibold">
                      Total
                    </td>
                    <td className="pt-3 text-right font-bold text-primary">
                      {fp(Number(order.total_price))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                <strong>Method:</strong> {order.delivery_method}
              </p>
              {order.delivery_method === "delivery" && order.street && (
                <p className="mt-2 text-muted-foreground">
                  {order.street}, {order.city}, {order.postcode}
                </p>
              )}
              {order.notes && (
                <p className="mt-3">
                  <strong>Your notes:</strong> {order.notes}
                </p>
              )}
              {order.pharmacist_notes && (
                <p className="mt-3">
                  <strong>Pharmacist notes:</strong> {order.pharmacist_notes}
                </p>
              )}
              {signedUrl && (
                <a href={signedUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block">
                  <Button size="sm" variant="outline">
                    View prescription
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {order.status === "cancelled" ? (
              <div className="text-center py-4 sm:py-6">
                <XCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-destructive" />
                <p className="mt-2 font-semibold text-destructive">Cancelled</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 sm:mt-4 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {deleting ? "Deleting…" : "Delete order"}
                </Button>
              </div>
            ) : (
              <>
                <ol className="space-y-3 sm:space-y-4">
                  {STEPS.map((s, i) => {
                    const done = i <= idx;
                    return (
                      <li key={s.key} className="flex items-start gap-2 sm:gap-3">
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-primary" />
                        ) : (
                          <Clock className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <p
                            className={`text-sm sm:text-base ${done ? "font-medium" : "text-muted-foreground"}`}
                          >
                            {s.label}
                          </p>
                          {i === idx && (
                            <p className="text-[10px] sm:text-xs text-primary">Current</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {(order.status === "pending" || order.status === "confirmed") && (
                  <div className="mt-4 sm:mt-6 border-t pt-3 sm:pt-4 space-y-2">
                    {order.status === "pending" && (
                      <Button variant="default" className="w-full" onClick={handleEdit}>
                        <Edit className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Edit order
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      <XCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {cancelling ? "Cancelling…" : "Cancel order"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
