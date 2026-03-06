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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { useProgram } from "../../context/ProgramContext";
import { useApi, apiPost, apiPut } from "../../hooks/use-api";
import type { Week, Mission } from "../../types/api";
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
  dueAt: string;
  type: Mission["type"];
  status: Mission["status"];
}

export function AdminCurriculum() {
  const { currentProgram } = useProgram();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("weeks");
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");

  // Week drawer
  const [weekDrawerOpen, setWeekDrawerOpen] = useState(false);
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null);
  const [weekForm, setWeekForm] = useState<WeekForm>({
    weekNo: 1,
    title: "",
    startDate: "",
    endDate: "",
    status: "DRAFT",
  });

  // Mission drawer
  const [missionDrawerOpen, setMissionDrawerOpen] = useState(false);
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [missionForm, setMissionForm] = useState<MissionForm>({
    weekId: "",
    title: "",
    dueAt: "",
    type: "REPORT",
    status: "DRAFT",
  });

  const { data: weeks, loading: weeksLoading, error: weeksError, refetch: refetchWeeks } =
    useApi<Week[]>(
      currentProgram ? `/programs/${currentProgram.id}/weeks` : null,
      [currentProgram?.id]
    );

  const weeksList = weeks ?? [];

  // Fetch missions for selected week (or first week when in missions tab)
  const activeWeekId = selectedWeekId || weeksList[0]?.id || "";

  const { data: missions, loading: missionsLoading, refetch: refetchMissions } =
    useApi<Mission[]>(
      currentProgram && activeWeekId
        ? `/programs/${currentProgram.id}/missions/weeks/${activeWeekId}`
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
        {status.toLowerCase()}
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
        {type.toLowerCase().replace("_", " ")}
      </Badge>
    );
  };

  // Week handlers
  const openCreateWeek = () => {
    setEditingWeekId(null);
    setWeekForm({ weekNo: weeksList.length + 1, title: "", startDate: "", endDate: "", status: "DRAFT" });
    setWeekDrawerOpen(true);
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
    setWeekDrawerOpen(true);
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
      setWeekDrawerOpen(false);
      refetchWeeks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save week");
    }
  };

  // Mission handlers
  const openCreateMission = () => {
    setEditingMissionId(null);
    setMissionForm({ weekId: activeWeekId, title: "", dueAt: "", type: "REPORT", status: "DRAFT" });
    setMissionDrawerOpen(true);
  };

  const openEditMission = (m: Mission) => {
    setEditingMissionId(m.id);
    setMissionForm({
      weekId: m.weekId,
      title: m.title,
      dueAt: m.dueAt ? format(new Date(m.dueAt), "yyyy-MM-dd") : "",
      type: m.type,
      status: m.status,
    });
    setMissionDrawerOpen(true);
  };

  const handleSaveMission = async () => {
    if (!missionForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      if (editingMissionId) {
        await apiPut(`/programs/${currentProgram!.id}/missions/${editingMissionId}`, missionForm);
        toast.success("Mission updated");
      } else {
        await apiPost(`/programs/${currentProgram!.id}/missions`, missionForm);
        toast.success("Mission created");
      }
      setMissionDrawerOpen(false);
      refetchMissions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save mission");
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        {tab === "missions" && (
          <Select value={activeWeekId} onValueChange={setSelectedWeekId}>
            <SelectTrigger size="sm" className="w-48">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
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
          onClick={tab === "weeks" ? openCreateWeek : openCreateMission}
        >
          <Plus className="size-3.5" />
          {tab === "weeks" ? "Create Week" : "Create Mission"}
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

        {/* Missions Tab */}
        <TabsContent value="missions">
          {missionsLoading ? (
            <div className="p-6 text-muted-foreground">Loading tests...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs w-16">Week</TableHead>
                  <TableHead className="h-8 text-xs">Mission Title</TableHead>
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
                          onClick={() => openEditMission(m)}
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

      {/* Week Drawer */}
      <Sheet open={weekDrawerOpen} onOpenChange={setWeekDrawerOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-sm">
              {editingWeekId ? "Edit Week" : "Create Week"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {editingWeekId ? "Update week details." : "Add a new week to the curriculum."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-4 flex-1 overflow-auto">
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
          <div className="p-4 border-t mt-auto">
            <Button className="w-full h-8 text-sm" onClick={handleSaveWeek}>
              {editingWeekId ? "Save Changes" : "Create Week"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mission Drawer */}
      <Sheet open={missionDrawerOpen} onOpenChange={setMissionDrawerOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-sm">
              {editingMissionId ? "Edit Mission" : "Create Mission"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {editingMissionId ? "Update mission details." : "Add a new mission to the curriculum."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-4 flex-1 overflow-auto">
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
          </div>
          <div className="p-4 border-t mt-auto">
            <Button className="w-full h-8 text-sm" onClick={handleSaveMission}>
              {editingMissionId ? "Save Changes" : "Create Mission"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
