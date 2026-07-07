import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useFormatPrice } from "@/hooks/use-format-price";
import { loadOrders, updateOrderStatus } from "@/lib/admin-service";

type OrderRow = {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  order_items: { id: string }[];
  profile?: { first_name: string | null; last_name: string | null } | null;
};

const STATUSES = [
  "pending",
  "confirmed",
  "in_preparation",
  "ready",
  "completed",
  "cancelled",
] as const;

const PAGE_SIZE = 10;

export function OrdersTab() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<"all" | (typeof STATUSES)[number]>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const fp = useFormatPrice();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadOrders(filter, page, PAGE_SIZE);
      setOrders(res.orders as OrderRow[]);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load orders");
    }
    setLoading(false);
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const sorted = [...orders].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "created_at":
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "total_price":
        cmp = Number(a.total_price) - Number(b.total_price);
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "customer": {
        const an = `${a.profile?.first_name ?? ""} ${a.profile?.last_name ?? ""}`.trim();
        const bn = `${b.profile?.first_name ?? ""} ${b.profile?.last_name ?? ""}`.trim();
        cmp = an.localeCompare(bn);
        break;
      }
      case "items":
        cmp = a.order_items.length - b.order_items.length;
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  async function updateStatus(id: string, status: (typeof STATUSES)[number]) {
    try {
      await updateOrderStatus(id, status);
      toast.success("Status updated");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Showing</p>
            <p className="text-2xl font-bold">{sorted.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Filter</p>
            <p className="text-2xl font-bold capitalize">{filter.replace("_", " ")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold">
              {fp(sorted.reduce((s, o) => s + Number(o.total_price), 0))}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>Order management</CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 flex-wrap">
              <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="total_price">Total</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="items">Items</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 shrink-0"
                onClick={() => setSortAsc(!sortAsc)}
                title={sortAsc ? "Ascending" : "Descending"}
              >
                {sortAsc ? "↑" : "↓"}
              </Button>
            </div>
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as "all" | (typeof STATUSES)[number])}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <>
              <div className="block md:hidden space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                ))}
              </div>
              <div className="hidden md:block space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-9 w-36 rounded-md" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="block md:hidden space-y-3">
                {sorted.map((o) => (
                  <div key={o.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">#{o.id.slice(0, 8)}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {o.profile?.first_name} {o.profile?.last_name}
                      </span>
                      <span className="text-muted-foreground">{o.order_items.length} items</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="capitalize">
                        {o.status.replace("_", " ")}
                      </Badge>
                      <span className="font-semibold">{fp(Number(o.total_price))}</span>
                    </div>
                    <Select
                      value={o.status}
                      onValueChange={(v) => updateStatus(o.id, v as (typeof STATUSES)[number])}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {sorted.length === 0 && (
                  <p className="text-center text-muted-foreground">No orders</p>
                )}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">#{o.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          {o.profile?.first_name} {o.profile?.last_name}
                        </TableCell>
                        <TableCell>{o.order_items.length}</TableCell>
                        <TableCell>{fp(Number(o.total_price))}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {o.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={o.status}
                            onValueChange={(v) =>
                              updateStatus(o.id, v as (typeof STATUSES)[number])
                            }
                          >
                            <SelectTrigger className="w-full sm:w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s.replace("_", " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sorted.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No orders
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {!loading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
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
