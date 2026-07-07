import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Edit, Eye, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatPrice } from "@/hooks/use-format-price";
import { useCart } from "@/lib/cart";
import {
  fetchUserOrders,
  cancelOrder,
  deleteOrder,
  fetchOrderById,
  getMedicationsByIds,
} from "@/lib/order-service";
import { Route as ParentRoute } from "@/routes/orders";

type OrderSummary = {
  id: string;
  total_price: number;
  status: string;
  delivery_method: string;
  created_at: string;
  order_items: { quantity: number }[];
};

const PAGE_SIZE = 20;

function OrdersPage() {
  const fp = useFormatPrice();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setLoading(true);
    fetchUserOrders(page, PAGE_SIZE)
      .then((data) => {
        const result = data as unknown as { orders: OrderSummary[]; total: number };
        setOrders(result.orders ?? []);
        setTotal(result.total ?? 0);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Could not load orders");
        setLoading(false);
      });
  }, [page]);

  async function handleEdit(orderId: string) {
    try {
      const data = await fetchOrderById(orderId);
      if (!data) {
        toast.error("Order not found");
        return;
      }
      const order = data as unknown as {
        id: string;
        order_items: Array<{
          medication_id?: string;
          quantity: number;
          unit_price: number;
          medications: { name: string } | null;
        }>;
      };
      const medIds = order.order_items.map((it) => it.medication_id).filter(Boolean) as string[];
      if (!medIds.length) {
        toast.error("No items in order");
        return;
      }
      const meds = await getMedicationsByIds(medIds);
      const cart = useCart.getState();
      cart.clear();
      for (const item of order.order_items) {
        const med = meds.find((m) => m.id === item.medication_id);
        if (med) {
          cart.add(
            {
              id: med.id,
              name: med.name,
              price: Number(med.price),
              stock: med.stock,
              image_url: med.image_url,
              requires_prescription: med.requires_prescription,
            },
            item.quantity,
          );
        }
      }
      navigate({ to: "/checkout", search: { editOrderId: orderId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load order");
    }
  }

  async function handleCancel(orderId: string) {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      await cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)));
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order");
    }
  }

  async function handleDelete(orderId: string) {
    if (!confirm("Delete this cancelled order permanently?")) return;
    try {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("Order deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete order");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold">My orders</h1>
      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-9 w-16 rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground">No orders yet.</p>
            <Link to="/medications" className="mt-4 inline-block">
              <Button>Browse medications</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">Order #{o.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {o.order_items.length} items · {o.delivery_method}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={o.status === "cancelled" ? "destructive" : "secondary"}
                      className="capitalize"
                    >
                      {o.status === "cancelled" && <XCircle className="mr-1 h-3 w-3" />}
                      {o.status.replace("_", " ")}
                    </Badge>
                    <p className="font-semibold text-primary">{fp(Number(o.total_price))}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Link to="/orders/$id" params={{ id: o.id }}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs px-2.5 sm:h-9 sm:text-sm sm:px-3"
                      >
                        <Eye className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                        View
                      </Button>
                    </Link>
                    {(o.status === "pending" || o.status === "confirmed") && (
                      <>
                        {o.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(o.id)}
                            className="h-8 text-xs px-2.5 sm:h-9 sm:text-sm sm:px-3"
                          >
                            <Edit className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                            Edit
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive h-8 text-xs px-2.5 sm:h-9 sm:text-sm sm:px-3"
                          onClick={() => handleCancel(o.id)}
                        >
                          <XCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {o.status === "cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-muted-foreground hover:text-destructive h-8 text-xs px-2.5 sm:h-9 sm:text-sm sm:px-3"
                        onClick={() => handleDelete(o.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!loading && total > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="default"
              className="h-10"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="default"
              className="h-10"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/orders/")({
  component: OrdersPage,
});
