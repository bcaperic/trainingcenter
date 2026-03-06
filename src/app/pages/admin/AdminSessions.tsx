import { useState, useMemo } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
import type { Session, Week, PaginatedResponse } from "../../types/api";
import { Plus, Search, Pencil, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SessionForm {
  weekId: string;
  title: string;
  startAt: string;
  endAt: string;
  type: Session["type"];
  capacity: number;
  locationOrUrl: string;
  recordingUrl: string;
}

const emptyForm: SessionForm = {
  weekId: "",
  title: "",
  startAt: "",
  endAt: "",
  type: "LIVE",
  capacity: 10,
  locationOrUrl: "",
  recordingUrl: "",
};

export function AdminSessions() {
  const { currentProgram } = useProgram();
  const [weekFilter, setWeekFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionForm>(emptyForm);

  const { data: weeks } = useApi<Week[]>(
    currentProgram ? `/programs/${currentProgram.id}/weeks` : null,
    [currentProgram?.id]
  );

  const weeksList = weeks ?? [];

  const weekIdParam = weekFilter !== "all" ? `?weekId=${weekFilter}` : "";

  const { data: sessionsData, loading, error, refetch } = useApi<PaginatedResponse<Session>>(
    currentProgram ? `/programs/${currentProgram.id}/sessions${weekIdParam}` : null,
    [currentProgram?.id, weekFilter]
  );

  const sessionsList = sessionsData?.data ?? [];

  const filtered = useMemo(() => {
    if (!search) return sessionsList;
    const q = search.toLowerCase();
    return sessionsList.filter(
      (s) => s.title.toLowerCase().includes(q)
    );
  }, [sessionsList, search]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, weekId: weeksList[0]?.id || "" });
    setDrawerOpen(true);
  };

  const openEdit = (s: Session) => {
    setEditingId(s.id);
    setForm({
      weekId: s.weekId || "",
      title: s.title,
      startAt: s.startAt ? format(new Date(s.startAt), "yyyy-MM-dd'T'HH:mm") : "",
      endAt: s.endAt ? format(new Date(s.endAt), "yyyy-MM-dd'T'HH:mm") : "",
      type: s.type,
      capacity: s.capacity || 10,
      locationOrUrl: s.locationOrUrl || "",
      recordingUrl: s.recordingUrl || "",
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      if (editingId) {
        await apiPut(`/programs/${currentProgram!.id}/sessions/${editingId}`, form);
        toast.success("Session updated");
      } else {
        await apiPost(`/programs/${currentProgram!.id}/sessions`, form);
        toast.success("Session created");
      }
      setDrawerOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save session");
    }
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      LIVE: "bg-blue-50 text-blue-700",
      DRILL: "bg-green-50 text-green-700",
      MAKEUP: "bg-amber-50 text-amber-700",
      EVAL: "bg-purple-50 text-purple-700",
      WAR_ROOM: "bg-gray-100 text-gray-600",
    };
    return (
      <Badge variant="secondary" className={`text-[11px] ${styles[type] || ""}`}>
        {type.toLowerCase().replace("_", " ")}
      </Badge>
    );
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-600",
      PUBLISHED: "bg-blue-50 text-blue-700",
      ONGOING: "bg-green-50 text-green-700",
      ENDED: "bg-green-50 text-green-700",
      CANCELED: "bg-red-50 text-red-600",
    };
    return (
      <Badge variant="secondary" className={`text-[11px] ${styles[status] || ""}`}>
        {status.toLowerCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Select value={weekFilter} onValueChange={setWeekFilter}>
          <SelectTrigger size="sm" className="w-48">
            <SelectValue placeholder="All Weeks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Weeks</SelectItem>
            {weeksList.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                Week {w.weekNo} - {w.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="flex-1" />
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate}>
          <Plus className="size-3.5" />
          Create Session
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 text-xs">Date / Time</TableHead>
            <TableHead className="h-8 text-xs">Type</TableHead>
            <TableHead className="h-8 text-xs">Title</TableHead>
            <TableHead className="h-8 text-xs">Capacity</TableHead>
            <TableHead className="h-8 text-xs">Status</TableHead>
            <TableHead className="h-8 text-xs w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((s) => (
            <TableRow key={s.id} className="h-9">
              <TableCell className="py-1.5 text-xs">
                <div>{format(new Date(s.startAt), "yyyy-MM-dd")}</div>
                <div className="text-muted-foreground">
                  {format(new Date(s.startAt), "HH:mm")}-{format(new Date(s.endAt), "HH:mm")}
                </div>
              </TableCell>
              <TableCell className="py-1.5">{typeBadge(s.type)}</TableCell>
              <TableCell className="py-1.5 text-xs" style={{ fontWeight: 500 }}>
                {s.title}
              </TableCell>
              <TableCell className="py-1.5 text-xs text-muted-foreground">
                {s.capacity ? `${s.enrolledCount ?? 0}/${s.capacity}` : "\u2014"}
              </TableCell>
              <TableCell className="py-1.5">{statusBadge(s.status)}</TableCell>
              <TableCell className="py-1.5">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  {s.status === "PUBLISHED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground"
                      onClick={async () => {
                        try {
                          await apiPut(`/programs/${currentProgram!.id}/sessions/${s.id}`, { status: "CANCELED" });
                          toast.success("Session cancelled");
                          refetch();
                        } catch {
                          toast.error("Failed to cancel session");
                        }
                      }}
                    >
                      <XCircle className="size-3.5" />
                    </Button>
                  )}
                </div>
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
              {editingId ? "Edit Session" : "Create Session"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {editingId ? "Update session details." : "Schedule a new session."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-4 flex-1 overflow-auto">
            <div className="space-y-1.5">
              <Label className="text-xs">Week</Label>
              <Select
                value={form.weekId}
                onValueChange={(v) => setForm({ ...form, weekId: v })}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {weeksList.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      W{w.weekNo} — {w.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                className="h-8 text-sm"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Session title"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Start</Label>
                <Input
                  className="h-8 text-sm"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End</Label>
                <Input
                  className="h-8 text-sm"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as Session["type"] })
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIVE">Live</SelectItem>
                    <SelectItem value="MAKEUP">Makeup</SelectItem>
                    <SelectItem value="DRILL">Drill</SelectItem>
                    <SelectItem value="EVAL">Eval</SelectItem>
                    <SelectItem value="WAR_ROOM">War Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Capacity</Label>
                <Input
                  className="h-8 text-sm"
                  type="number"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Location / Meeting URL</Label>
              <Input
                className="h-8 text-sm"
                value={form.locationOrUrl}
                onChange={(e) => setForm({ ...form, locationOrUrl: e.target.value })}
                placeholder="https://meet.google.com/..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Recording URL</Label>
              <Input
                className="h-8 text-sm"
                value={form.recordingUrl}
                onChange={(e) => setForm({ ...form, recordingUrl: e.target.value })}
                placeholder="https://example.com/recording/..."
              />
            </div>
          </div>
          <div className="p-4 border-t mt-auto">
            <Button className="w-full h-8 text-sm" onClick={handleSave}>
              {editingId ? "Save Changes" : "Create Session"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
