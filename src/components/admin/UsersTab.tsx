import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ShieldAlert, User, Plus, Trash2, ArrowUpDown, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  getAllUsers,
  updateUserRole,
  createUser,
  deleteUser,
  updateUserProfile,
} from "@/lib/user-admin-service";
import { useAuth } from "@/lib/auth";

const ROLES = ["admin", "pharmacist", "patient"] as const;

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string;
  roles: string[];
};

export function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<{ userId: string; role: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRoleValue, setAddRoleValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    street: "",
    city: "",
    postcode: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...users].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "name": {
        const an = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || "unnamed user";
        const bn = `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim() || "unnamed user";
        cmp = an.localeCompare(bn);
        break;
      }
      case "role": {
        const ar = a.roles[0] ?? "";
        const br = b.roles[0] ?? "";
        cmp = ar.localeCompare(br);
        break;
      }
    }
    return sortAsc ? cmp : -cmp;
  });

  async function load() {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data as UserRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addRole(userId: string, role: string) {
    setAssigning({ userId, role });
    try {
      await updateUserRole(userId, role as "admin" | "pharmacist" | "patient", "add");
      toast.success(`Role "${role}" added`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add role");
    }
    setAssigning(null);
  }

  async function removeRole(userId: string, role: string) {
    setAssigning({ userId, role });
    try {
      await updateUserRole(userId, role as "admin" | "pharmacist" | "patient", "remove");
      toast.success(`Role "${role}" removed`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove role");
    }
    setAssigning(null);
  }

  async function handleAddUser() {
    if (!addEmail || !addPassword) return;
    setSaving(true);
    try {
      await createUser(addEmail, addPassword, addRoleValue);
      toast.success("User created");
      setAddOpen(false);
      setAddEmail("");
      setAddPassword("");
      setAddRoleValue("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
      load();
    }
    setSaving(false);
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      toast.success("User deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : err instanceof Response
            ? `Server error (${err.status})`
            : "Failed to delete user";
      toast.error(msg);
    }
  }

  function startEdit(u: UserRow) {
    setEditTarget(u);
    setEditForm({
      first_name: u.first_name ?? "",
      last_name: u.last_name ?? "",
      phone: "",
      street: "",
      city: "",
      postcode: "",
    });
  }

  async function handleEditSave() {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      await updateUserProfile(editTarget.id, editForm);
      toast.success("User updated");
      setEditTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    }
    setEditSaving(false);
  }

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 border-red-200",
    pharmacist: "bg-blue-100 text-blue-800 border-blue-200",
    patient: "bg-green-100 text-green-800 border-green-200",
  };

  const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    admin: ShieldAlert,
    pharmacist: Shield,
    patient: User,
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>User roles ({users.length})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
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
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Add user
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add user</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={addRoleValue} onValueChange={setAddRoleValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddUser} disabled={saving || !addEmail || !addPassword}>
                  {saving ? "Creating…" : "Create user"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sorted.map((u) => {
            const availableRoles = ROLES.filter((r) => !u.roles.includes(r));
            const isSelf = u.id === currentUser?.id;
            return (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {u.first_name || u.last_name
                      ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                      : "Unnamed user"}
                    {isSelf && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        You
                      </Badge>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {u.roles.map((role: string) => {
                      const Icon = roleIcons[role] || User;
                      return (
                        <Badge
                          key={role}
                          variant="outline"
                          className={`gap-1 px-2 py-0.5 text-xs ${roleColors[role] ?? ""}`}
                        >
                          <Icon className="h-3 w-3" />
                          {role}
                          <button
                            onClick={() =>
                              role === "patient" ? setDeleteTarget(u) : removeRole(u.id, role)
                            }
                            disabled={
                              (assigning?.userId === u.id && assigning?.role === role) ||
                              (role === "patient" && false) ||
                              (role === "admin" && isSelf)
                            }
                            className="ml-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
                            title={
                              role === "patient"
                                ? "Delete user"
                                : role === "admin" && isSelf
                                  ? "Cannot remove your own admin role"
                                  : "Remove role"
                            }
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Select
                    value=""
                    onValueChange={(role) => addRole(u.id, role)}
                    disabled={assigning?.userId === u.id}
                  >
                    <SelectTrigger className="w-full sm:w-[130px]">
                      <SelectValue placeholder="Add role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          All roles assigned
                        </SelectItem>
                      ) : (
                        availableRoles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 shrink-0 text-muted-foreground hover:text-primary"
                    onClick={() => startEdit(u)}
                    title="Edit user"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!isSelf && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(u)}
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No users found.</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>
                {(deleteTarget?.first_name ?? deleteTarget?.last_name)
                  ? `${deleteTarget?.first_name ?? ""} ${deleteTarget?.last_name ?? ""}`.trim()
                  : "this user"}
              </strong>{" "}
              and all their data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editTarget !== null} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First name</Label>
                <Input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Last name</Label>
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Street</Label>
              <Input
                value={editForm.street}
                onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Postcode</Label>
                <Input
                  value={editForm.postcode}
                  onChange={(e) => setEditForm({ ...editForm, postcode: e.target.value })}
                />
              </div>
            </div>
          </div>
          <Button onClick={handleEditSave} disabled={editSaving}>
            {editSaving ? "Saving…" : "Save"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
