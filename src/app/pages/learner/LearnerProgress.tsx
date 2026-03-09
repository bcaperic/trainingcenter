import { useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { EmptyState } from "../../components/EmptyState";
import { useProgram } from "../../context/ProgramContext";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../hooks/use-api";
import type {
  LearnerDashboardData,
  Attendance,
  PaginatedResponse,
  Submission,
} from "../../types/api";
import { format } from "date-fns";
import { capitalize } from "../../lib/format";
import {
  Folder,
  CalendarX,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";

export function LearnerProgress() {
  const { currentProgram } = useProgram();
  const { user } = useAuth();

  const pid = currentProgram?.id;

  const { data: dashboard, loading: loadingDash } =
    useApi<LearnerDashboardData>(pid ? `/programs/${pid}/dashboard/learner` : null, [pid]);

  const { data: attendanceData, loading: loadingAttend } =
    useApi<Attendance[]>(pid ? `/programs/${pid}/me/attendance` : null, [pid]);

  const { data: submissionsData, loading: loadingSubs } =
    useApi<PaginatedResponse<Submission>>(pid ? `/programs/${pid}/me/submissions` : null, [pid]);

  const attendance = attendanceData ?? [];
  const submissions = submissionsData?.data ?? [];

  const attendPresent = useMemo(
    () => attendance.filter((r) => r.status === "PRESENT").length,
    [attendance]
  );
  const attendLate = useMemo(
    () => attendance.filter((r) => r.status === "LATE").length,
    [attendance]
  );
  const attendTotal = attendance.length;

  const missionCompleted = useMemo(
    () =>
      submissions.filter(
        (s) => s.status === "SUBMITTED" || s.status === "REVIEWED" || s.status === "PASS"
      ).length,
    [submissions]
  );
  const missionTotal = submissions.length;

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above."
      />
    );
  }

  if (loadingDash || loadingAttend || loadingSubs) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (!dashboard) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No data yet"
        description={`"${currentProgram.name}" has no progress data available.`}
      />
    );
  }

  const attendStatusStyle: Record<string, string> = {
    PRESENT: "bg-green-50 text-green-700",
    ABSENT: "bg-red-50 text-red-600",
    LATE: "bg-amber-50 text-amber-700",
    EXCUSED: "bg-gray-100 text-gray-600",
  };

  const subStatusStyle: Record<string, string> = {
    SUBMITTED: "bg-blue-50 text-blue-700",
    REVIEWED: "bg-green-50 text-green-700",
    PASS: "bg-green-50 text-green-700",
    FAIL: "bg-red-50 text-red-600",
    RETURNED: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="gap-0 p-3">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-blue-500" />
              <p className="text-[11px] text-muted-foreground">Attendance</p>
            </div>
            <p className="text-xl" style={{ fontWeight: 600 }}>
              {dashboard.attendanceRate}%
            </p>
            <Progress value={dashboard.attendanceRate} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {attendPresent} present, {attendLate} late of {attendTotal}
            </p>
          </CardContent>
        </Card>
        <Card className="gap-0 p-3">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-green-500" />
              <p className="text-[11px] text-muted-foreground">Completion</p>
            </div>
            <p className="text-xl" style={{ fontWeight: 600 }}>
              {dashboard.completionRate}%
            </p>
            <Progress value={dashboard.completionRate} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {missionCompleted} of {missionTotal} tests done
            </p>
          </CardContent>
        </Card>
        <Card className="gap-0 p-3">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-purple-500" />
              <p className="text-[11px] text-muted-foreground">Points & Gate</p>
            </div>
            <p className="text-xl" style={{ fontWeight: 600 }}>
              {dashboard.points ?? 0}
            </p>
            <Badge
              variant="secondary"
              className={`text-[10px] ${
                dashboard.gateStatus === "passed"
                  ? "bg-green-50 text-green-700"
                  : dashboard.gateStatus === "failed"
                  ? "bg-red-50 text-red-600"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              Gate: {dashboard.gateStatus ?? "—"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card className="gap-0">
        <div className="px-3 py-2 border-b">
          <h4 className="text-xs" style={{ fontWeight: 600 }}>
            Attendance History
          </h4>
        </div>
        <CardContent className="p-0">
          {attendance.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No attendance records yet
            </p>
          ) : (
            <div className="divide-y">
              {attendance.map((r) => (
                <div key={r.id} className="px-3 py-2 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ fontWeight: 500 }}>
                      {r.session?.title ?? "Session"}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" />
                      {r.session?.startAt
                        ? format(new Date(r.session.startAt), "yyyy-MM-dd")
                        : r.checkedInAt
                        ? format(new Date(r.checkedInAt), "yyyy-MM-dd")
                        : "—"}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] shrink-0 ${attendStatusStyle[r.status] || ""}`}
                  >
                    {capitalize(r.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Progress */}
      <Card className="gap-0">
        <div className="px-3 py-2 border-b">
          <h4 className="text-xs" style={{ fontWeight: 600 }}>
            Test Progress
          </h4>
        </div>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No tests yet
            </p>
          ) : (
            <div className="divide-y">
              {submissions.map((s) => (
                <div key={s.id} className="px-3 py-2 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ fontWeight: 500 }}>
                      Mission Submission
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Submitted: {format(new Date(s.submittedAt), "yyyy-MM-dd")}
                      {s.score !== null && ` · Score: ${s.score}`}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] shrink-0 ${subStatusStyle[s.status] || ""}`}
                  >
                    {capitalize(s.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
