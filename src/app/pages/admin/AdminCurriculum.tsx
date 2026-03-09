import { useState, useMemo, useRef } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { useProgram } from "../../context/ProgramContext";
import { useApi, apiPost, apiPut } from "../../hooks/use-api";
import api from "../../lib/api-client";
import type { Week, Mission, MissionAttachment } from "../../types/api";
import { Plus, Search, Pencil, Upload, Download, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { capitalize } from "../../lib/format";

interface WeekForm {
  weekNo: number;
  title: string;
  startDate: string;
  endDate: string;
  status: Week["status"];
}

interface MissionForm {
  weekId: string;
  title: string;
  description: string;
  dueAt: string;
  type: Mission["type"];
  status: Mission["status"];
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function AdminCurriculum() {
  const { currentProgram } = useProgram();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("weeks");
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");

  // Week modal
  const [weekModalOpen, setWeekModalOpen] = useState(false);
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null);
  const [weekForm, setWeekForm] = useState<WeekForm>({
    weekNo: 1,
    title: "",
    startDate: "",
    endDate: "",
    status: "DRAFT",
  });

  // Test modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [missionForm, setMissionForm] = useState<MissionForm>({
    weekId: "",
    title: "",
    description: "",
    dueAt: "",
    type: "REPORT",
    status: "DRAFT",
  });

  // Test attachments
  const [missionAttachments, setMissionAttachments] = useState<MissionAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: weeks, loading: weeksLoading, error: weeksError, refetch: refetchWeeks } =
    useApi<Week[]>(
      currentProgram ? `/programs/${currentProgram.id}/weeks` : null,
      [currentProgram?.id]
    );

  const weeksList = weeks ?? [];

  const activeWeekId = selectedWeekId || "all";

  const { data: missions, loading: missionsLoading, refetch: refetchMissions } =
    useApi<Mission[]>(
      currentProgram
        ? activeWeekId === "all"
          ? `/programs/${currentProgram.id}/missions`
          : `/programs/${currentProgram.id}/missions/weeks/${activeWeekId}`
        : null,
      [currentProgram?.id, activeWeekId]
    );

  const missionsList = missions ?? [];

  const filteredWeeks = useMemo(() => {
    if (!search) return weeksList;
    const q = search.toLowerCase();
    return weeksList.filter((w) => w.title.toLowerCase().includes(q));
  }, [weeksList, search]);

  const filteredMissions = useMemo(() => {
    if (!search) return missionsList;
    const q = search.toLowerCase();
    return missionsList.filter((m) => m.title.toLowerCase().includes(q));
  }, [missionsList, search]);

  if (weeksLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (weeksError) return <div className="p-6 text-red-500">Error: {weeksError}</div>;

  const publishBadge = (status: string) => {
    const styles: Record<string, string> = {
      PUBLISHED: "bg-green-50 text-green-700",
      DRAFT: "bg-amber-50 text-amber-700",
      CLOSED: "bg-gray-100 text-gray-600",
    };
    return (
      <Badge variant="secondary" className={`text-[11px] ${styles[status] || ""}`}>
        {capitalize(status)}
      </Badge>
    );
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      REPORT: "bg-blue-50 text-blue-700",
      CODE: "bg-purple-50 text-purple-700",
      TEST: "bg-emerald-50 text-emerald-700",
      DRILL_RESULT: "bg-orange-50 text-orange-700",
    };
    return (
      <Badge variant="secondary" className={`text-[11px] ${styles[type] || ""}`}>
        {capitalize(type)}
      </Badge>
    );
  };

  // ── Attachment helpers ──

  const loadAttachments = async (missionId: string) => {
    try {
      const res = await api.get(`/programs/${currentProgram!.id}/missions/${missionId}/attachments`);
      setMissionAttachments(res.data);
    } catch {
      setMissionAttachments([]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingMissionId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(
        `/programs/${currentProgram!.id}/missions/${editingMissionId}/attachments`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success("File uploaded");
      await loadAttachments(editingMissionId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadAttachment = async (att: MissionAttachment) => {
    try {
      const res = await api.get(
        `/programs/${currentProgram!.id}/missions/${att.missionId}/attachments/${att.id}/download`,
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

  const handleDeleteAttachment = async (att: MissionAttachment) => {
    try {
      await api.delete(
        `/programs/${currentProgram!.id}/missions/${att.missionId}/attachments/${att.id}`
      );
      toast.success("Attachment deleted");
      setMissionAttachments((prev) => prev.filter((a) => a.id !== att.id));
    } catch {
      toast.error("Delete failed");
    }
  };

  // ── Week handlers ──

  const openCreateWeek = () => {
    setEditingWeekId(null);
    setWeekForm({ weekNo: weeksList.length + 1, title: "", startDate: "", endDate: "", status: "DRAFT" });
    setWeekModalOpen(true);
  };

  const openEditWeek = (w: Week) => {
    setEditingWeekId(w.id);
    setWeekForm({
      weekNo: w.weekNo,
      title: w.title,
      startDate: w.startDate ? format(new Date(w.startDate), "yyyy-MM-dd") : "",
      endDate: w.endDate ? format(new Date(w.endDate), "yyyy-MM-dd") : "",
      status: w.status,
    });
    setWeekModalOpen(true);
  };

  const handleSaveWeek = async () => {
    if (!weekForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      if (editingWeekId) {
        await apiPut(`/programs/${currentProgram!.id}/weeks/${editingWeekId}`, weekForm);
        toast.success("Week updated");
      } else {
        await apiPost(`/programs/${currentProgram!.id}/weeks`, weekForm);
        toast.success("Week created");
      }
      setWeekModalOpen(false);
      refetchWeeks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save week");
    }
  };

  // ── Test handlers ──

  const openCreateTest = () => {
    setEditingMissionId(null);
    setMissionForm({ weekId: activeWeekId === "all" ? (weeksList[0]?.id || "") : activeWeekId, title: "", description: "", dueAt: "", type: "REPORT", status: "DRAFT" });
    setMissionAttachments([]);
    setTestModalOpen(true);
  };

  const openEditTest = (m: Mission) => {
    setEditingMissionId(m.id);
    setMissionForm({
      weekId: m.weekId,
      title: m.title,
      description: m.description || "",
      dueAt: m.dueAt ? format(new Date(m.dueAt), "yyyy-MM-dd") : "",
      type: m.type,
      status: m.status,
    });
    setTestModalOpen(true);
    loadAttachments(m.id);
  };

  const handleSaveTest = async () => {
    if (!missionForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      if (editingMissionId) {
        await apiPut(`/programs/${currentProgram!.id}/missions/${editingMissionId}`, missionForm);
        toast.success("Test updated");
      } else {
        await apiPost(`/programs/${currentProgram!.id}/missions`, missionForm);
        toast.success("Test created");
      }
      setTestModalOpen(false);
      refetchMissions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save test");
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        {tab === "missions" && (
          <Select value={activeWeekId} onValueChange={setSelectedWeekId}>
            <SelectTrigger size="sm" className="w-48">
              <SelectValue placeholder="All Tests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tests</SelectItem>
              {weeksList.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  Week {w.weekNo} - {w.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="flex-1" />
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={tab === "weeks" ? openCreateWeek : openCreateTest}
        >
          <Plus className="size-3.5" />
          {tab === "weeks" ? "Create Week" : "Create Test"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-8">
          <TabsTrigger value="weeks" className="text-xs px-3 h-7">
            Weeks ({filteredWeeks.length})
          </TabsTrigger>
          <TabsTrigger value="missions" className="text-xs px-3 h-7">
            Tests ({filteredMissions.length})
          </TabsTrigger>
        </TabsList>

        {/* Weeks Tab */}
        <TabsContent value="weeks">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-xs w-16">Week</TableHead>
                <TableHead className="h-8 text-xs">Title</TableHead>
                <TableHead className="h-8 text-xs">Period</TableHead>
                <TableHead className="h-8 text-xs">Status</TableHead>
                <TableHead className="h-8 text-xs w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWeeks.map((w) => (
                <TableRow key={w.id} className="h-9">
                  <TableCell className="py-1.5 text-xs" style={{ fontWeight: 500 }}>
                    W{w.weekNo}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs" style={{ fontWeight: 500 }}>
                    {w.title}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    {w.startDate && w.endDate
                      ? `${format(new Date(w.startDate), "yyyy-MM-dd")} ~ ${format(new Date(w.endDate), "MM-dd")}`
                      : "-"}
                  </TableCell>
                  <TableCell className="py-1.5">{publishBadge(w.status)}</TableCell>
                  <TableCell className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => openEditWeek(w)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tests Tab */}
        <TabsContent value="missions">
          {missionsLoading ? (
            <div className="p-6 text-muted-foreground">Loading tests...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs w-16">Week</TableHead>
                  <TableHead className="h-8 text-xs">Test Title</TableHead>
                  <TableHead className="h-8 text-xs">Due</TableHead>
                  <TableHead className="h-8 text-xs">Type</TableHead>
                  <TableHead className="h-8 text-xs">Status</TableHead>
                  <TableHead className="h-8 text-xs w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMissions.map((m) => {
                  const week = weeksList.find((w) => w.id === m.weekId);
                  return (
                    <TableRow key={m.id} className="h-9">
                      <TableCell className="py-1.5 text-xs text-muted-foreground">
                        {week ? `W${week.weekNo}` : "-"}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs" style={{ fontWeight: 500 }}>
                        {m.title}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-muted-foreground">
                        {m.dueAt ? format(new Date(m.dueAt), "yyyy-MM-dd") : "-"}
                      </TableCell>
                      <TableCell className="py-1.5">{typeBadge(m.type)}</TableCell>
                      <TableCell className="py-1.5">{publishBadge(m.status)}</TableCell>
                      <TableCell className="py-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openEditTest(m)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Week Modal */}
      <FloatingModal open={weekModalOpen} onOpenChange={setWeekModalOpen}>
        <FloatingModalHeader>
          <FloatingModalTitle className="text-sm">
            {editingWeekId ? "Edit Week" : "Create Week"}
          </FloatingModalTitle>
          <FloatingModalDescription className="text-xs">
            {editingWeekId ? "Update week details." : "Add a new week to the curriculum."}
          </FloatingModalDescription>
        </FloatingModalHeader>
        <div className="px-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Week No.</Label>
              <Input
                className="h-8 text-sm"
                type="number"
                value={weekForm.weekNo}
                onChange={(e) =>
                  setWeekForm({ ...weekForm, weekNo: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={weekForm.status}
                onValueChange={(v) =>
                  setWeekForm({ ...weekForm, status: v as Week["status"] })
                }
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input
              className="h-8 text-sm"
              value={weekForm.title}
              onChange={(e) => setWeekForm({ ...weekForm, title: e.target.value })}
              placeholder="e.g. Framework & Message Parsing"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input
                className="h-8 text-sm"
                type="date"
                value={weekForm.startDate}
                onChange={(e) => setWeekForm({ ...weekForm, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Input
                className="h-8 text-sm"
                type="date"
                value={weekForm.endDate}
                onChange={(e) => setWeekForm({ ...weekForm, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
        <FloatingModalFooter className="p-4">
          <Button className="w-full h-8 text-sm" onClick={handleSaveWeek}>
            {editingWeekId ? "Save Changes" : "Create Week"}
          </Button>
        </FloatingModalFooter>
      </FloatingModal>

      {/* Test Modal */}
      <FloatingModal open={testModalOpen} onOpenChange={setTestModalOpen} className="sm:max-w-4xl">
        <FloatingModalHeader>
          <FloatingModalTitle className="text-sm">
            {editingMissionId ? "Edit Test" : "Create Test"}
          </FloatingModalTitle>
          <FloatingModalDescription className="text-xs">
            {editingMissionId ? "Update test details." : "Add a new test to the curriculum."}
          </FloatingModalDescription>
        </FloatingModalHeader>
        <div className="px-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Week</Label>
            <Select
              value={missionForm.weekId}
              onValueChange={(v) =>
                setMissionForm({ ...missionForm, weekId: v })
              }
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
              value={missionForm.title}
              onChange={(e) =>
                setMissionForm({ ...missionForm, title: e.target.value })
              }
              placeholder="e.g. Architecture Diagram"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              className="text-sm"
              style={{ minHeight: 120 }}
              value={missionForm.description}
              onChange={(e) =>
                setMissionForm({ ...missionForm, description: e.target.value })
              }
              placeholder="Test instructions, requirements, grading criteria..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Due Date</Label>
              <Input
                className="h-8 text-sm"
                type="date"
                value={missionForm.dueAt}
                onChange={(e) =>
                  setMissionForm({ ...missionForm, dueAt: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={missionForm.type}
                onValueChange={(v) =>
                  setMissionForm({
                    ...missionForm,
                    type: v as Mission["type"],
                  })
                }
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REPORT">Report</SelectItem>
                  <SelectItem value="CODE">Code</SelectItem>
                  <SelectItem value="TEST">Test</SelectItem>
                  <SelectItem value="DRILL_RESULT">Drill Result</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={missionForm.status}
              onValueChange={(v) =>
                setMissionForm({
                  ...missionForm,
                  status: v as Mission["status"],
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attachments — only in edit mode */}
          {editingMissionId && (
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
              {missionAttachments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No attachments yet.</p>
              ) : (
                <div className="space-y-1">
                  {missionAttachments.map((att) => (
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
        <FloatingModalFooter className="p-4">
          <Button className="w-full h-8 text-sm" onClick={handleSaveTest}>
            {editingMissionId ? "Save Changes" : "Create Test"}
          </Button>
        </FloatingModalFooter>
      </FloatingModal>
    </div>
  );
}
