import { useState, useRef } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Calendar } from "../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { useProgram } from "../../context/ProgramContext";
import { apiPost, apiPut, apiDelete } from "../../hooks/use-api";
import api from "../../lib/api-client";
import type { Program, ProgramAttachment } from "../../types/api";
import {
  Plus,
  Search,
  Pencil,
  Ban,
  CalendarIcon,
  Upload,
  Download,
  Trash2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { capitalize } from "../../lib/format";

type ProgramStatus = Program["status"];

interface ProgramForm {
  name: string;
  shortName: string;
  description: string;
  duration: string;
  startDate: string;
  endDate: string;
  status: ProgramStatus;
}

const emptyForm: ProgramForm = {
  name: "",
  shortName: "",
  description: "",
  duration: "",
  startDate: "",
  endDate: "",
  status: "DRAFT",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return format(new Date(iso), "yyyy-MM-dd");
  } catch {
    return "-";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Date Picker Component ───
function DatePicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-8 w-full justify-start text-left text-xs font-normal"
        >
          <CalendarIcon className="mr-1.5 size-3.5 text-muted-foreground" />
          {selected ? format(selected, "yyyy-MM-dd") : <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) => {
            onChange(day ? day.toISOString() : "");
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function AdminPrograms() {
  const { allPrograms, loading } = useProgram();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramForm>(emptyForm);

  // Attachments
  const [attachments, setAttachments] = useState<ProgramAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  const filtered = allPrograms.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.shortName.toLowerCase().includes(search.toLowerCase())
  );

  const loadAttachments = async (programId: string) => {
    setAttachmentsLoading(true);
    try {
      const res = await api.get<ProgramAttachment[]>(
        `/programs/${programId}/attachments`
      );
      setAttachments(res.data);
    } catch {
      setAttachments([]);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAttachments([]);
    setModalOpen(true);
  };

  const openEdit = (p: Program) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      shortName: p.shortName,
      description: p.description,
      duration: p.duration,
      startDate: p.startDate || "",
      endDate: p.endDate || "",
      status: p.status,
    });
    setModalOpen(true);
    loadAttachments(p.id);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.shortName.trim()) {
      toast.error("Name and short name are required");
      return;
    }
    try {
      const payload = {
        ...form,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (editingId) {
        await apiPut(`/programs/${editingId}`, payload);
        toast.success("Program updated");
      } else {
        await apiPost("/programs", payload);
        toast.success("Program created");
      }
      setModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save program");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/programs/${editingId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("File uploaded");
      await loadAttachments(editingId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (att: ProgramAttachment) => {
    try {
      const res = await api.get(
        `/programs/${att.programId}/attachments/${att.id}/download`,
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

  const handleDeleteAttachment = async (att: ProgramAttachment) => {
    try {
      await apiDelete(`/programs/${att.programId}/attachments/${att.id}`);
      toast.success("Attachment deleted");
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
    } catch {
      toast.error("Delete failed");
    }
  };

  const statusBadge = (status: ProgramStatus) => {
    const styles: Record<string, string> = {
      ACTIVE: "bg-green-50 text-green-700",
      DRAFT: "bg-blue-50 text-blue-700",
      ARCHIVED: "bg-gray-100 text-gray-600",
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
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="flex-1" />
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate}>
          <Plus className="size-3.5" />
          Create Program
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 text-xs">Program Name</TableHead>
            <TableHead className="h-8 text-xs">Start Date</TableHead>
            <TableHead className="h-8 text-xs">End Date</TableHead>
            <TableHead className="h-8 text-xs">Status</TableHead>
            <TableHead className="h-8 text-xs">Members</TableHead>
            <TableHead className="h-8 text-xs w-28">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((p) => (
            <TableRow key={p.id} className="h-9">
              <TableCell className="py-1.5">
                <div>
                  <span className="text-xs" style={{ fontWeight: 500 }}>{p.name}</span>
                  <span className="text-[11px] text-muted-foreground ml-1.5">({p.shortName})</span>
                </div>
              </TableCell>
              <TableCell className="py-1.5 text-xs text-muted-foreground">
                {formatDate(p.startDate)}
              </TableCell>
              <TableCell className="py-1.5 text-xs text-muted-foreground">
                {formatDate(p.endDate)}
              </TableCell>
              <TableCell className="py-1.5">{statusBadge(p.status)}</TableCell>
              <TableCell className="py-1.5 text-xs text-muted-foreground">
                {p.memberCount ?? 0}
              </TableCell>
              <TableCell className="py-1.5">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground"
                    onClick={() => toast("Program disabled")}
                  >
                    <Ban className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingId ? "Edit Program" : "Create Program"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingId
                ? "Update program details below."
                : "Fill in the details to create a new program."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name & Short Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Program Name *</Label>
                <Input
                  className="h-8 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Developer Foundations"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Short Name *</Label>
                <Input
                  className="h-8 text-sm"
                  value={form.shortName}
                  onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                  placeholder="e.g. DEV FDN"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <textarea
                className="w-full h-16 text-xs border rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Program description..."
              />
            </div>

            {/* Dates & Duration & Status */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <DatePicker
                  value={form.startDate}
                  onChange={(v) => setForm({ ...form, startDate: v })}
                  placeholder="Pick date"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Date</Label>
                <DatePicker
                  value={form.endDate}
                  onChange={(v) => setForm({ ...form, endDate: v })}
                  placeholder="Pick date"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Duration</Label>
                <Input
                  className="h-8 text-sm"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 24 weeks"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as ProgramStatus })
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Attachments — only shown when editing */}
            {editingId && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Training Materials</Label>
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

                {attachmentsLoading ? (
                  <div className="text-xs text-muted-foreground py-2">Loading attachments...</div>
                ) : attachments.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2">No attachments yet.</div>
                ) : (
                  <div className="space-y-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 text-xs"
                      >
                        <FileText className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate font-medium">{att.filename}</span>
                        <span className="text-muted-foreground shrink-0">
                          {formatFileSize(att.size)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDownload(att)}
                        >
                          <Download className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
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

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={handleSave}>
              {editingId ? "Save Changes" : "Create Program"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
