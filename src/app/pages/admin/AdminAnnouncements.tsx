import { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { EmptyState } from "../../components/EmptyState";
import { useProgram } from "../../context/ProgramContext";
import { useApi, apiPost, apiPut, apiDelete } from "../../hooks/use-api";
import type { Announcement, PaginatedResponse } from "../../types/api";
import {
  Megaphone,
  Plus,
  Pin,
  Pencil,
  Trash2,
  Folder,
} from "lucide-react";
import { toast } from "sonner";

export function AdminAnnouncements() {
  const { currentProgram } = useProgram();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", body: "", pinned: false });

  const { data: announcementsData, loading, error, refetch } =
    useApi<PaginatedResponse<Announcement>>(
      currentProgram ? `/programs/${currentProgram.id}/announcements` : null,
      [currentProgram?.id]
    );

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above."
      />
    );
  }

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  const announcements = announcementsData?.data ?? [];

  const programAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", body: "", pinned: false });
    setDrawerOpen(true);
  };

  const openEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setForm({ title: ann.title, body: ann.body, pinned: ann.isPinned });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    try {
      if (editingId) {
        await apiPut(`/programs/${currentProgram.id}/announcements/${editingId}`, {
          title: form.title,
          body: form.body,
          isPinned: form.pinned,
        });
        toast.success("Announcement updated");
      } else {
        await apiPost(`/programs/${currentProgram.id}/announcements`, {
          title: form.title,
          body: form.body,
          isPinned: form.pinned,
          status: "PUBLISHED",
        });
        toast.success("Announcement published");
      }
      setDrawerOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save announcement");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/programs/${currentProgram.id}/announcements/${id}`);
      toast.success("Announcement deleted");
      refetch();
    } catch {
      toast.error("Failed to delete announcement");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm" style={{ fontWeight: 600 }}>
            Announcements
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create and manage announcements for learners.
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate}>
          <Plus className="size-3.5" />
          New Announcement
        </Button>
      </div>

      {programAnnouncements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description="Create an announcement to notify learners."
        />
      ) : (
        <Card className="gap-0">
          <CardContent className="p-0">
            <div className="divide-y">
              {programAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="px-3 py-2.5 flex items-start gap-3"
                >
                  <div
                    className={`size-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      ann.isPinned
                        ? "bg-amber-50 text-amber-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {ann.isPinned ? (
                      <Pin className="size-3.5" />
                    ) : (
                      <Megaphone className="size-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p
                        className="text-xs truncate"
                        style={{ fontWeight: 500 }}
                      >
                        {ann.title}
                      </p>
                      {ann.isPinned && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] bg-amber-50 text-amber-700 px-1 py-0"
                        >
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {ann.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDate(ann.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0"
                      onClick={() => openEdit(ann)}
                    >
                      <Pencil className="size-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0"
                      onClick={() => handleDelete(ann.id)}
                    >
                      <Trash2 className="size-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-96">
          <SheetHeader>
            <SheetTitle className="text-sm">
              {editingId ? "Edit Announcement" : "New Announcement"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                className="text-sm"
                placeholder="Announcement title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Body</Label>
              <Textarea
                className="text-sm min-h-[120px]"
                placeholder="Announcement body"
                value={form.body}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, body: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.pinned}
                onCheckedChange={(val) =>
                  setForm((prev) => ({ ...prev, pinned: val }))
                }
              />
              <Label className="text-xs">Pin to top</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 h-9 text-xs"
                onClick={handleSave}
                disabled={!form.title.trim() || !form.body.trim()}
              >
                {editingId ? "Update" : "Publish"}
              </Button>
              <Button
                variant="outline"
                className="h-9 text-xs"
                onClick={() => setDrawerOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
