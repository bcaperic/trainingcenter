import { useState, useMemo, useRef } from "react";
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
  FloatingModal,
  FloatingModalHeader,
  FloatingModalTitle,
  FloatingModalDescription,
  FloatingModalFooter,
} from "../../components/FloatingModal";
import { useProgram } from "../../context/ProgramContext";
import { useApi, apiPost, apiPut } from "../../hooks/use-api";
import api from "../../lib/api-client";
import type { Session, Week, PaginatedResponse, ProgramMember, SessionAttachment } from "../../types/api";
import { Plus, Search, Pencil, XCircle, Upload, Download, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { capitalize } from "../../lib/format";

interface SessionForm {
  weekId: string;
  instructorId: string;
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
  instructorId: "",
  title: "",
  startAt: "",
  endAt: "",
  type: "LIVE",
  capacity: 10,
  locationOrUrl: "",
  recordingUrl: "",
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function AdminSessions() {
  const { currentProgram } = useProgram();
  const [weekFilter, setWeekFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionForm>(emptyForm);

  // Attachments
  const [sessionAttachments, setSessionAttachments] = useState<SessionAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: weeks } = useApi<Week[]>(
    currentProgram ? `/programs/${currentProgram.id}/weeks` : null,
    [currentProgram?.id]
  );

  const weeksList = weeks ?? [];

  const { data: membersData } = useApi<PaginatedResponse<ProgramMember>>(
    currentProgram ? `/programs/${currentProgram.id}/users?pageSize=200` : null,
    [currentProgram?.id]
  );

  const instructors = useMemo(() => {
    const members = membersData?.data ?? [];
    return members.filter((m) => m.role === "INSTRUCTOR" || m.role === "ADMIN");
  }, [membersData]);

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

  // ── Attachment helpers ──

  const loadAttachments = async (sessionId: string) => {
    try {
      const res = await api.get(`/programs/${currentProgram!.id}/sessions/${sessionId}/attachments`);
      setSessionAttachments(res.data);
    } catch {
      setSessionAttachments([]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(
        `/programs/${currentProgram!.id}/sessions/${editingId}/attachments`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success("File uploaded");
      await loadAttachments(editingId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadAttachment = async (att: SessionAttachment) => {
    try {
      const res = await api.get(
        `/programs/${currentProgram!.id}/sessions/${att.sessionId}/attachments/${att.id}/download`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = att.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };

  const handleDeleteAttachment = async (att: SessionAttachment) => {
    try {
      await api.delete(
        `/programs/${currentProgram!.id}/sessions/${att.sessionId}/attachments/${att.id}`
      );
      toast.success("Attachment deleted");
      setSessionAttachments((prev) => prev.filter((a) => a.id !== att.id));
    } catch {
      toast.error("Delete failed");
    }
  };

  // ── Handlers ──

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, weekId: weeksList[0]?.id || "" });
    setSessionAttachments([]);
    setModalOpen(true);
  };

  const openEdit = (s: Session) => {
    setEditingId(s.id);
    setForm({
      weekId: s.weekId || "",
      instructorId: s.instructorId || "",
      title: s.title,
      startAt: s.startAt ? format(new Date(s.startAt), "yyyy-MM-dd'T'HH:mm") : "",
      endAt: s.endAt ? format(new Date(s.endAt), "yyyy-MM-dd'T'HH:mm") : "",
      type: s.type,
      capacity: s.capacity || 10,
      locationOrUrl: s.locationOrUrl || "",
      recordingUrl: s.recordingUrl || "",
    });
    setModalOpen(true);
    loadAttachments(s.id);
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
      setModalOpen(false);
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
        {capitalize(type)}
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
        {capitalize(status)}
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
            <TableHead className="h-8 text-xs">Instructor</TableHead>
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
                {s.instructorName || "\u2014"}
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

      {/* Create/Edit Modal */}
      <FloatingModal open={modalOpen} onOpenChange={setModalOpen}>
        <FloatingModalHeader>
          <FloatingModalTitle className="text-sm">
            {editingId ? "Edit Session" : "Create Session"}
          </FloatingModalTitle>
          <FloatingModalDescription className="text-xs">
            {editingId ? "Update session details." : "Schedule a new session."}
          </FloatingModalDescription>
        </FloatingModalHeader>
        <div className="px-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
              <Label className="text-xs">Instructor</Label>
              <Select
                value={form.instructorId || "__none__"}
                onValueChange={(v) => setForm({ ...form, instructorId: v === "__none__" ? "" : v })}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {instructors.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          {/* Attachments — only in edit mode */}
          {editingId && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Attachments</Label>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="size-3" />
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
              {sessionAttachments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No attachments yet.</p>
              ) : (
                <div className="space-y-1">
                  {sessionAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 border rounded px-2 py-1.5 bg-muted/20"
                    >
                      <FileText className="size-3 text-muted-foreground shrink-0" />
                      <span className="text-xs truncate flex-1">{att.filename}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatFileSize(att.size)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => handleDownloadAttachment(att)}
                      >
                        <Download className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0 text-destructive"
                        onClick={() => handleDeleteAttachment(att)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <FloatingModalFooter className="flex gap-2 p-4">
          <Button className="flex-1 h-9 text-xs" onClick={handleSave}>
            {editingId ? "Save Changes" : "Create Session"}
          </Button>
          <Button
            variant="outline"
            className="h-9 text-xs"
            onClick={() => setModalOpen(false)}
          >
            Cancel
          </Button>
        </FloatingModalFooter>
      </FloatingModal>
    </div>
  );
}
