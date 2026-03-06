import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
import type { Team } from "../../types/api";
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from "sonner";

interface TeamForm {
  name: string;
  lead: string;
}

const emptyForm: TeamForm = { name: "", lead: "" };

export function AdminTeams() {
  const { currentProgram } = useProgram();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamForm>(emptyForm);

  const { data: teams, loading, error, refetch } = useApi<Team[]>(
    currentProgram ? `/programs/${currentProgram.id}/teams` : null,
    [currentProgram?.id]
  );

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  const teamsList = teams ?? [];

  const filtered = teamsList.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };

  const openEdit = (t: Team) => {
    setEditingId(t.id);
    setForm({ name: t.name, lead: t.lead?.name || "" });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    try {
      if (editingId) {
        await apiPut(`/programs/${currentProgram!.id}/teams/${editingId}`, {
          name: form.name,
        });
        toast.success("Team updated");
      } else {
        await apiPost(`/programs/${currentProgram!.id}/teams`, {
          name: form.name,
        });
        toast.success("Team created");
      }
      setDrawerOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save team");
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="flex-1" />
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate}>
          <Plus className="size-3.5" />
          Create Team
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 text-xs">Team Name</TableHead>
            <TableHead className="h-8 text-xs">Members</TableHead>
            <TableHead className="h-8 text-xs">Lead</TableHead>
            <TableHead className="h-8 text-xs w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((t) => (
            <TableRow key={t.id} className="h-9">
              <TableCell className="py-1.5 text-xs" style={{ fontWeight: 500 }}>
                {t.name}
              </TableCell>
              <TableCell className="py-1.5 text-xs text-muted-foreground">
                {t.memberCount ?? 0}
              </TableCell>
              <TableCell className="py-1.5 text-xs text-muted-foreground">
                {t.lead?.name || "\u2014"}
              </TableCell>
              <TableCell className="py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => openEdit(t)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create/Edit Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-sm">
              {editingId ? "Edit Team" : "Create Team"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {editingId ? "Update team details." : "Add a new team."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-4 flex-1 overflow-auto">
            <div className="space-y-1.5">
              <Label className="text-xs">Team Name</Label>
              <Input
                className="h-8 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Auth Team"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Team Lead (optional)</Label>
              <Input
                className="h-8 text-sm"
                value={form.lead}
                onChange={(e) => setForm({ ...form, lead: e.target.value })}
                placeholder="e.g. Felix"
                disabled
              />
            </div>
          </div>
          <div className="p-4 border-t mt-auto">
            <Button className="w-full h-8 text-sm" onClick={handleSave}>
              {editingId ? "Save Changes" : "Create Team"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
