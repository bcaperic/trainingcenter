import { useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../components/ui/sheet";
import { useProgram } from "../../context/ProgramContext";
import { useApi, apiPost, apiPut } from "../../hooks/use-api";
import type { ProgramMember, PaginatedResponse, Team } from "../../types/api";
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from "sonner";

interface UserForm {
  name: string;
  email: string;
  role: "ADMIN" | "INSTRUCTOR" | "TRAINEE";
  teamId: string;
  active: boolean;
}

const emptyForm: UserForm = {
  name: "",
  email: "",
  role: "TRAINEE",
  teamId: "",
  active: true,
};

export function AdminUsers() {
  const { currentProgram } = useProgram();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const { data: usersData, loading: usersLoading, error: usersError, refetch: refetchUsers } =
    useApi<PaginatedResponse<ProgramMember>>(
      currentProgram ? `/programs/${currentProgram.id}/users` : null,
      [currentProgram?.id]
    );

  const { data: teams } = useApi<Team[]>(
    currentProgram ? `/programs/${currentProgram.id}/teams` : null,
    [currentProgram?.id]
  );

  if (usersLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (usersError) return <div className="p-6 text-red-500">Error: {usersError}</div>;

  const members = usersData?.data ?? [];
  const teamsList = teams ?? [];

  const filtered = members.filter((m) => {
    const matchSearch =
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || m.role === roleFilter.toUpperCase();
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };

  const openEdit = (m: ProgramMember) => {
    setEditingId(m.userId);
    setForm({
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      teamId: m.teamId || "",
      active: m.status === "ACTIVE",
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    try {
      if (editingId) {
        await apiPut(`/programs/${currentProgram!.id}/users/${editingId}`, {
          role: form.role,
          teamId: form.teamId || null,
          status: form.active ? "ACTIVE" : "PAUSED",
        });
        toast.success("User updated");
      } else {
        await apiPost(`/programs/${currentProgram!.id}/users/invite`, {
          email: form.email,
          name: form.name,
          role: form.role,
          teamId: form.teamId || null,
        });
        toast.success("User invited");
      }
      setDrawerOpen(false);
      refetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save user");
    }
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-purple-50 text-purple-700",
      INSTRUCTOR: "bg-blue-50 text-blue-700",
      TRAINEE: "bg-gray-100 text-gray-600",
    };
    return (
      <Badge variant="secondary" className={`text-[11px] ${styles[role] || ""}`}>
        {role.toLowerCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="instructor">Instructor</SelectItem>
            <SelectItem value="trainee">Trainee</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate}>
          <Plus className="size-3.5" />
          Invite User
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 text-xs">Name</TableHead>
            <TableHead className="h-8 text-xs">Email</TableHead>
            <TableHead className="h-8 text-xs">Role</TableHead>
            <TableHead className="h-8 text-xs">Team</TableHead>
            <TableHead className="h-8 text-xs">Status</TableHead>
            <TableHead className="h-8 text-xs w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((m) => (
            <TableRow key={m.id} className="h-9">
              <TableCell className="py-1.5 text-xs" style={{ fontWeight: 500 }}>
                {m.user.name}
              </TableCell>
              <TableCell className="py-1.5 text-xs text-muted-foreground">
                {m.user.email}
              </TableCell>
              <TableCell className="py-1.5">{roleBadge(m.role)}</TableCell>
              <TableCell className="py-1.5 text-xs text-muted-foreground capitalize">
                {m.team?.name || "-"}
              </TableCell>
              <TableCell className="py-1.5">
                <Badge
                  variant="secondary"
                  className={`text-[11px] ${
                    m.status === "ACTIVE"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {m.status.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell className="py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => openEdit(m)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-sm">
              {editingId ? "Edit User" : "Invite User"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {editingId ? "Update user details and permissions." : "Invite a new user to the program."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-4 flex-1 overflow-auto">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input
                className="h-8 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Nguyen Van A"
                disabled={!!editingId}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                className="h-8 text-sm"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. user@company.com"
                disabled={!!editingId}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm({ ...form, role: v as UserForm["role"] })
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                    <SelectItem value="TRAINEE">Trainee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Team</Label>
                <Select
                  value={form.teamId}
                  onValueChange={(v) => setForm({ ...form, teamId: v })}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {teamsList.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editingId && (
              <div className="flex items-center justify-between pt-1">
                <Label className="text-xs">Active</Label>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
            )}
          </div>
          <div className="p-4 border-t mt-auto">
            <Button className="w-full h-8 text-sm" onClick={handleSave}>
              {editingId ? "Save Changes" : "Send Invite"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
