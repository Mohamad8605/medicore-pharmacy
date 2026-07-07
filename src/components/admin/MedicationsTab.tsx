import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pill, Search, RefreshCw, AlertTriangle, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useFormatPrice } from "@/hooks/use-format-price";
import { useStockSync } from "@/lib/use-stock-sync";
import { useStockStore } from "@/lib/stock-store";
import {
  fetchAllMedications,
  createMedication,
  updateMedication,
  getAllSettings,
} from "@/lib/admin-service";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MedicationRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  active_ingredient: string | null;
  dosage: string | null;
  manufacturer: string | null;
  side_effects: string | null;
  image_url: string | null;
  requires_prescription: boolean;
  is_active: boolean;
  created_at: string;
};

type MedicationForm = {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  active_ingredient: string;
  dosage: string;
  manufacturer: string;
  side_effects: string;
  image_url: string;
  requires_prescription: boolean;
  is_active?: boolean;
};

const emptyForm: MedicationForm = {
  name: "",
  description: "",
  category: "",
  price: 0,
  stock: 0,
  active_ingredient: "",
  dosage: "",
  manufacturer: "",
  side_effects: "",
  image_url: "",
  requires_prescription: false,
};

export function MedicationsTab() {
  const [meds, setMeds] = useState<MedicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MedicationForm>(emptyForm);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<MedicationForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const fp = useFormatPrice();
  const ids = meds.map((m) => m.id);
  const stockMap = useStockSync(ids);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  async function load() {
    try {
      const [data, settings] = await Promise.all([
        fetchAllMedications(),
        getAllSettings().catch(() => ({}) as Record<string, unknown>),
      ]);
      setMeds(data as MedicationRow[]);
      const threshold = (settings as Record<string, unknown>).low_stock_threshold;
      if (threshold !== undefined) setLowStockThreshold(Number(threshold));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load medications");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = query
    ? meds.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
    : meds;

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "category":
        cmp = a.category.localeCompare(b.category);
        break;
      case "price":
        cmp = Number(a.price) - Number(b.price);
        break;
      case "stock":
        cmp = a.stock - b.stock;
        break;
      case "status":
        cmp = Number(a.is_active) - Number(b.is_active);
        break;
      case "created_at":
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  function startEdit(m: MedicationRow) {
    setEditId(m.id);
    setEditForm({
      name: m.name,
      description: m.description ?? "",
      category: m.category,
      price: m.price,
      stock: m.stock,
      active_ingredient: m.active_ingredient ?? "",
      dosage: m.dosage ?? "",
      manufacturer: m.manufacturer ?? "",
      side_effects: m.side_effects ?? "",
      image_url: m.image_url ?? "",
      requires_prescription: m.requires_prescription,
      is_active: m.is_active,
    });
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await updateMedication(id, editForm);
      toast.success("Medication updated");
      setEditId(null);
      load();
      useStockStore.getState().refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
    setSaving(false);
  }

  async function saveNew() {
    setSaving(true);
    try {
      await createMedication(addForm);
      toast.success("Medication created");
      setAddOpen(false);
      setAddForm(emptyForm);
      load();
      useStockStore.getState().refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    }
    setSaving(false);
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await updateMedication(id, { is_active: !current } as unknown as Record<string, unknown>);
      toast.success(current ? "Deactivated" : "Activated");
      load();
      useStockStore.getState().refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const lowStockCount = sorted.filter(
    (m) => (stockMap[m.id] ?? m.stock) <= lowStockThreshold,
  ).length;

  return (
    <div className="space-y-4">
      {lowStockCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{lowStockCount}</span> medication
              {lowStockCount !== 1 ? "s" : ""} at or below the low-stock threshold (
              {lowStockThreshold}).
            </p>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl">All medications ({meds.length})</CardTitle>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="created_at">Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setSortAsc(!sortAsc)}
                title={sortAsc ? "Ascending" : "Descending"}
              >
                {sortAsc ? "↑" : "↓"}
              </Button>
            </div>
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 w-full sm:w-60"
                placeholder="Search by name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Add medication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add medication</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={addForm.name}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Input
                      value={addForm.category}
                      onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Price *</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={addForm.price}
                        onChange={(e) =>
                          setAddForm({ ...addForm, price: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label>Stock *</Label>
                      <Input
                        type="number"
                        min={0}
                        value={addForm.stock}
                        onChange={(e) =>
                          setAddForm({ ...addForm, stock: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Active ingredient</Label>
                    <Input
                      value={addForm.active_ingredient}
                      onChange={(e) =>
                        setAddForm({ ...addForm, active_ingredient: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Dosage</Label>
                    <Input
                      value={addForm.dosage}
                      onChange={(e) => setAddForm({ ...addForm, dosage: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Manufacturer</Label>
                    <Input
                      value={addForm.manufacturer}
                      onChange={(e) => setAddForm({ ...addForm, manufacturer: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Side effects</Label>
                    <Textarea
                      value={addForm.side_effects}
                      onChange={(e) => setAddForm({ ...addForm, side_effects: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={addForm.image_url}
                      onChange={(e) => setAddForm({ ...addForm, image_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={addForm.description}
                      onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="add-prescription"
                      checked={addForm.requires_prescription}
                      onCheckedChange={(v) => setAddForm({ ...addForm, requires_prescription: v })}
                    />
                    <Label htmlFor="add-prescription">Requires prescription</Label>
                  </div>
                </div>
                <Button onClick={saveNew} disabled={saving || !addForm.name || !addForm.category}>
                  {saving ? "Saving…" : "Create medication"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="block md:hidden space-y-3 p-4">
            {sorted.map((m) => (
              <Card key={m.id} className={!m.is_active ? "opacity-60" : ""}>
                <CardContent className="p-4 space-y-3">
                  {editId === m.id ? (
                    <>
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Label>Price</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={editForm.price}
                            onChange={(e) =>
                              setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <Label>Stock</Label>
                          <Input
                            type="number"
                            min={0}
                            value={editForm.stock}
                            onChange={(e) =>
                              setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editForm.is_active}
                          onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })}
                        />
                        <span className="text-xs">
                          {editForm.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="default"
                          className="h-10"
                          onClick={() => saveEdit(m.id)}
                          disabled={saving}
                        >
                          Save
                        </Button>
                        <Button
                          size="default"
                          variant="outline"
                          className="h-10"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-primary/60" />
                        <span className="font-medium">{m.name}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Category:</span> {m.category}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price:</span>{" "}
                          {fp(Number(m.price))}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stock:</span>{" "}
                          {stockMap[m.id] ?? m.stock}
                          {(stockMap[m.id] ?? m.stock) <= lowStockThreshold && (
                            <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <Badge variant={m.is_active ? "default" : "secondary"}>
                            {m.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="default"
                          variant="outline"
                          className="h-10"
                          onClick={() => startEdit(m)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="default"
                          variant="outline"
                          className="h-10"
                          onClick={() => toggleActive(m.id, m.is_active)}
                        >
                          {m.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No medications found.</p>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((m) => (
                  <TableRow key={m.id} className={!m.is_active ? "opacity-60" : ""}>
                    <TableCell>
                      {editId === m.id ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <span className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-primary/60" />
                          {m.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === m.id ? (
                        <Input
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        />
                      ) : (
                        m.category
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === m.id ? (
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })
                          }
                          className="w-24"
                        />
                      ) : (
                        fp(Number(m.price))
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === m.id ? (
                        <Input
                          type="number"
                          min={0}
                          value={editForm.stock}
                          onChange={(e) =>
                            setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })
                          }
                          className="w-20"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          {stockMap[m.id] ?? m.stock}
                          {(stockMap[m.id] ?? m.stock) <= lowStockThreshold && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          {stockMap[m.id] !== undefined && stockMap[m.id] !== m.stock && (
                            <RefreshCw className="h-3 w-3 text-muted-foreground/50" />
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === m.id ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={editForm.is_active}
                            onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })}
                          />
                          <span className="text-xs">
                            {editForm.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      ) : (
                        <Badge variant={m.is_active ? "default" : "secondary"}>
                          {m.is_active ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === m.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="default"
                            className="h-10"
                            onClick={() => saveEdit(m.id)}
                            disabled={saving}
                          >
                            Save
                          </Button>
                          <Button
                            size="default"
                            variant="outline"
                            className="h-10"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="default"
                            variant="outline"
                            className="h-10"
                            onClick={() => startEdit(m)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="default"
                            variant="outline"
                            className="h-10"
                            onClick={() => toggleActive(m.id, m.is_active)}
                          >
                            {m.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No medications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
