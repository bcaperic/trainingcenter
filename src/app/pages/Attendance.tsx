import { useState, useMemo } from "react";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  FloatingModal,
  FloatingModalHeader,
  FloatingModalTitle,
  FloatingModalDescription,
} from "../components/FloatingModal";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { EmptyState } from "../components/EmptyState";
import { useProgram } from "../context/ProgramContext";
import { useApi } from "../hooks/use-api";
import type {
  Week,
  Session,
  Mission,
  PaginatedResponse,
  AdminDashboardData,
  OpsSummaryResponse,
} from "../types/api";
import { Folder, CalendarX, ClipboardCheck, Clock } from "lucide-react";
import { capitalize } from "../lib/format";
import { format } from "date-fns";

function formatTimeRange(startAt: string, endAt: string): string {
  try {
    return `${format(new Date(startAt), "HH:mm")}-${format(new Date(endAt), "HH:mm")}`;
  } catch {
    return "";
  }
}

function deriveSessionStatus(session: Session): "UPCOMING" | "ONGOING" | "ENDED" | "CANCELED" {
  if (session.status === "CANCELED") return "CANCELED";
  if (session.status === "ENDED") return "ENDED";
  if (session.status === "ONGOING") return "ONGOING";
  const now = new Date();
  const start = new Date(session.startAt);
  const end = new Date(session.endAt);
  if (now < start) return "UPCOMING";
  if (now >= start && now <= end) return "ONGOING";
  return "ENDED";
}

const sessionStatusStyles: Record<string, string> = {
  UPCOMING: "bg-blue-50 text-blue-700",
  ONGOING: "bg-green-50 text-green-700",
  ENDED: "bg-gray-100 text-gray-600",
  CANCELED: "bg-red-50 text-red-600",
};

const attendanceStatusStyles: Record<string, string> = {
  PRESENT: "bg-green-50 text-green-700",
  LATE: "bg-amber-50 text-amber-700",
  ABSENT: "bg-red-50 text-red-600",
  EXCUSED: "bg-gray-100 text-gray-600",
};

export function Attendance() {
  const { currentProgram } = useProgram();
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [drilldownFilter, setDrilldownFilter] = useState<"all" | "not_checked_in" | "late" | "absent" | "not_submitted">("all");

  const { data: weeks } = useApi<Week[]>(
    currentProgram ? `/programs/${currentProgram.id}/weeks` : null,
    [currentProgram?.id]
  );

  const weekIdParam = selectedWeek !== "all" ? `?weekId=${selectedWeek}` : "";

  const { data: sessionsData, loading, error } = useApi<PaginatedResponse<Session>>(
    currentProgram ? `/programs/${currentProgram.id}/sessions${weekIdParam}` : null,
    [currentProgram?.id, selectedWeek]
  );

  const { data: dashboard } = useApi<AdminDashboardData>(
    currentProgram ? `/programs/${currentProgram.id}/dashboard/admin` : null,
    [currentProgram?.id]
  );

  const { data: missions } = useApi<Mission[]>(
    currentProgram ? `/programs/${currentProgram.id}/missions` : null,
    [currentProgram?.id]
  );

  const { data: detail, loading: detailLoading } = useApi<OpsSummaryResponse>(
    currentProgram && selectedSessionId
      ? `/programs/${currentProgram.id}/sessions/${selectedSessionId}/ops-summary`
      : null,
    [currentProgram?.id, selectedSessionId]
  );

  const weeksList = weeks ?? [];
  const sessionsList = sessionsData?.data ?? [];
  const missionsList = missions ?? [];

  // Lookup maps
  const weekMap = useMemo(() => {
    const map: Record<string, Week> = {};
    for (const w of weeksList) map[w.id] = w;
    return map;
  }, [weeksList]);

  const missionCountByWeek = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of missionsList) {
      map[m.weekId] = (map[m.weekId] || 0) + 1;
    }
    return map;
  }, [missionsList]);

  // Filter + sort trainees in drilldown
  const filteredTrainees = useMemo(() => {
    if (!detail) return [];
    let list = [...detail.trainees];

    // Apply filter
    switch (drilldownFilter) {
      case "not_checked_in":
        list = list.filter((t) => !t.attendanceStatus);
        break;
      case "late":
        list = list.filter((t) => t.attendanceStatus === "LATE");
        break;
      case "absent":
        list = list.filter((t) => t.attendanceStatus === "ABSENT" || !t.attendanceStatus);
        break;
      case "not_submitted":
        list = list.filter((t) => !t.testSubmissionStatus);
        break;
    }

    // Sort: not checked in first, then late, then absent, then present
    const statusOrder: Record<string, number> = {
      "": 0, // not checked in
      ABSENT: 1,
      LATE: 2,
      EXCUSED: 3,
      PRESENT: 4,
    };
    list.sort((a, b) => {
      const aOrder = statusOrder[a.attendanceStatus || ""] ?? 0;
      const bOrder = statusOrder[b.attendanceStatus || ""] ?? 0;
      return aOrder - bOrder;
    });

    return list;
  }, [detail, drilldownFilter]);

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above to view attendance."
      />
    );
  }

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  if (weeksList.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No weeks created"
        description={`"${currentProgram.name}" has no scheduled weeks yet.`}
      />
    );
  }

  const attendanceRate = dashboard?.avgAttendanceRate ?? 0;
  const completionRate = dashboard?.avgCompletionRate ?? 0;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger size="sm" className="w-44">
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
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Attendance Rate</p>
            <p className="text-sm" style={{ fontWeight: 600 }}>
              {attendanceRate}%
            </p>
          </div>
          <Progress value={attendanceRate} className="h-1.5" />
        </div>
        <div className="border rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Test Pass Rate</p>
            <p className="text-sm" style={{ fontWeight: 600 }}>
              {completionRate}%
            </p>
          </div>
          <Progress value={completionRate} className="h-1.5" />
        </div>
      </div>

      {/* Sessions List */}
      {sessionsList.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No sessions"
          description="No sessions found for this selection."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-xs w-20">Week</TableHead>
              <TableHead className="h-8 text-xs">Session</TableHead>
              <TableHead className="h-8 text-xs">Date / Time</TableHead>
              <TableHead className="h-8 text-xs w-24">Status</TableHead>
              <TableHead className="h-8 text-xs w-20">Tests</TableHead>
              <TableHead className="h-8 text-xs w-24">Enrolled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionsList.map((session) => {
              const sStatus = deriveSessionStatus(session);
              const week = session.weekId ? weekMap[session.weekId] : null;
              const testCount = session.weekId ? (missionCountByWeek[session.weekId] || 0) : 0;
              return (
                <TableRow
                  key={session.id}
                  className="h-9 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    {week ? `W${week.weekNo}` : "\u2014"}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs" style={{ fontWeight: 500 }}>
                    {session.title}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    <div>{format(new Date(session.startAt), "yyyy-MM-dd")}</div>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatTimeRange(session.startAt, session.endAt)}
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${sessionStatusStyles[sStatus] || ""}`}
                    >
                      {capitalize(sStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    {testCount > 0 ? testCount : "\u2014"}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    {session.enrolledCount ?? 0}
                    {session.capacity ? `/${session.capacity}` : ""}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Session Attendance Detail Modal */}
      <FloatingModal
        open={!!selectedSessionId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSessionId(null);
            setDrilldownFilter("all");
          }
        }}
      >
          {detailLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : detail ? (
            <>
              <FloatingModalHeader>
                <FloatingModalTitle className="text-sm">{detail.session.title}</FloatingModalTitle>
                <FloatingModalDescription className="text-xs">
                  {format(new Date(detail.session.startAt), "yyyy-MM-dd")}
                  {" "}
                  {formatTimeRange(detail.session.startAt, detail.session.endAt)}
                </FloatingModalDescription>
              </FloatingModalHeader>
              <div className="space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="border rounded-md p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Trainees</p>
                    <p className="text-base" style={{ fontWeight: 600 }}>
                      {detail.summary.totalTrainees}
                    </p>
                  </div>
                  <div className="border rounded-md p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Checked In</p>
                    <p className="text-base text-green-700" style={{ fontWeight: 600 }}>
                      {detail.summary.checkedIn}
                    </p>
                  </div>
                  <div className="border rounded-md p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Late</p>
                    <p className="text-base text-amber-600" style={{ fontWeight: 600 }}>
                      {detail.summary.lateCount}
                    </p>
                  </div>
                  <div className="border rounded-md p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Not Checked In</p>
                    <p className="text-base text-red-600" style={{ fontWeight: 600 }}>
                      {detail.summary.notCheckedIn}
                    </p>
                  </div>
                  <div className="border rounded-md p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Tests (week)</p>
                    <p className="text-base" style={{ fontWeight: 600 }}>
                      {detail.summary.totalMissions}
                    </p>
                  </div>
                </div>

                {/* Quick filter buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {([
                    { key: "all", label: "All" },
                    { key: "not_checked_in", label: "Not Checked In" },
                    { key: "late", label: "Late" },
                    { key: "absent", label: "Absent" },
                    { key: "not_submitted", label: "Not Submitted" },
                  ] as const).map((f) => (
                    <Button
                      key={f.key}
                      variant={drilldownFilter === f.key ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[11px] px-2"
                      onClick={() => setDrilldownFilter(f.key)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>

                {/* Per-trainee table */}
                {filteredTrainees.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {drilldownFilter === "all" ? "No trainees enrolled" : "No trainees match this filter"}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-7 text-[11px]">Name</TableHead>
                        <TableHead className="h-7 text-[11px]">Team</TableHead>
                        <TableHead className="h-7 text-[11px] w-24">Attendance</TableHead>
                        <TableHead className="h-7 text-[11px] w-28">Tests</TableHead>
                        <TableHead className="h-7 text-[11px] w-24">Submission</TableHead>
                        <TableHead className="h-7 text-[11px] w-32">Check-in Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrainees.map((t) => (
                        <TableRow key={t.userId} className="h-8">
                          <TableCell className="py-1">
                            <p className="text-xs" style={{ fontWeight: 500 }}>
                              {t.userName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{t.userEmail}</p>
                          </TableCell>
                          <TableCell className="py-1 text-xs text-muted-foreground">
                            {t.teamName || "-"}
                          </TableCell>
                          <TableCell className="py-1">
                            {t.attendanceStatus ? (
                              <Badge
                                variant="secondary"
                                className={`text-[10px] ${attendanceStatusStyles[t.attendanceStatus] || ""}`}
                              >
                                {capitalize(t.attendanceStatus)}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600">
                                Absent
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1 text-xs text-muted-foreground">
                            {t.completedMissions}/{t.totalMissions} completed
                          </TableCell>
                          <TableCell className="py-1">
                            {t.testSubmissionStatus ? (
                              <Badge
                                variant="secondary"
                                className={`text-[10px] ${
                                  t.testSubmissionStatus === "PASS" || t.testSubmissionStatus === "REVIEWED"
                                    ? "bg-green-50 text-green-700"
                                    : t.testSubmissionStatus === "SUBMITTED"
                                      ? "bg-blue-50 text-blue-700"
                                      : t.testSubmissionStatus === "FAIL" || t.testSubmissionStatus === "RETURNED"
                                        ? "bg-red-50 text-red-600"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {capitalize(t.testSubmissionStatus)}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">{"\u2014"}</span>
                            )}
                          </TableCell>
                          <TableCell className="py-1 text-[11px] text-muted-foreground">
                            {t.checkedInAt
                              ? format(new Date(t.checkedInAt), "HH:mm:ss")
                              : "\u2014"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          ) : null}
      </FloatingModal>
    </div>
  );
}
