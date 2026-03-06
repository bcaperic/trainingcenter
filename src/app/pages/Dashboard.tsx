import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { EmptyState } from "../components/EmptyState";
import { useProgram } from "../context/ProgramContext";
import { useApi } from "../hooks/use-api";
import type { LearnerDashboardData, Session } from "../types/api";
import {
  TrendingUp,
  CheckCircle,
  Star,
  Clock,
  AlertTriangle,
  Folder,
  CalendarX,
} from "lucide-react";
import { format } from "date-fns";

function formatSessionType(type: Session["type"]): string {
  const map: Record<string, string> = {
    LIVE: "online",
    MAKEUP: "makeup",
    DRILL: "drill",
    EVAL: "eval",
    WAR_ROOM: "war room",
  };
  return map[type] || type.toLowerCase();
}

function formatTimeRange(startAt: string, endAt: string): string {
  try {
    return `${format(new Date(startAt), "HH:mm")}-${format(new Date(endAt), "HH:mm")}`;
  } catch {
    return "";
  }
}

export function Dashboard() {
  const { currentProgram } = useProgram();

  const { data: dashboard, loading, error } = useApi<LearnerDashboardData>(
    currentProgram ? `/programs/${currentProgram.id}/dashboard` : null,
    [currentProgram?.id]
  );

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above to view your dashboard."
      />
    );
  }

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  if (!dashboard) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No data available"
        description={`No dashboard data found for "${currentProgram.name}".`}
      />
    );
  }

  const upcomingSessions = dashboard.upcomingSessions || [];

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="gap-0 p-3">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="text-2xl mt-0.5" style={{ fontWeight: 600 }}>
                  {dashboard.attendanceRate}%
                </p>
              </div>
              <div className="size-8 rounded-md bg-blue-50 flex items-center justify-center">
                <TrendingUp className="size-4 text-primary" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
        <Card className="gap-0 p-3">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completion</p>
                <p className="text-2xl mt-0.5" style={{ fontWeight: 600 }}>
                  {dashboard.completionRate}%
                </p>
              </div>
              <div className="size-8 rounded-md bg-green-50 flex items-center justify-center">
                <CheckCircle className="size-4 text-green-600" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
        <Card className="gap-0 p-3">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Points</p>
                <p className="text-2xl mt-0.5" style={{ fontWeight: 600 }}>
                  {dashboard.points}
                </p>
              </div>
              <div className="size-8 rounded-md bg-amber-50 flex items-center justify-center">
                <Star className="size-4 text-amber-500" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total earned</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Upcoming Sessions */}
        <Card className="gap-0">
          <div className="px-3 py-2.5 border-b">
            <h4 className="text-sm" style={{ fontWeight: 600 }}>
              Upcoming Sessions
            </h4>
          </div>
          <CardContent className="p-0">
            {upcomingSessions.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <CalendarX className="size-5 text-muted-foreground mb-1.5" />
                <p className="text-xs text-muted-foreground">
                  No upcoming sessions
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {upcomingSessions.map((session) => {
                  const displayType = formatSessionType(session.type);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm truncate"
                          style={{ fontWeight: 500 }}
                        >
                          {session.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {format(new Date(session.startAt), "yyyy-MM-dd")} {formatTimeRange(session.startAt, session.endAt)}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[11px] ${
                          session.type === "LIVE"
                            ? "bg-blue-50 text-blue-700"
                            : session.type === "DRILL"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {displayType}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gate Status */}
        <Card className="gap-0">
          <div className="px-3 py-2.5 border-b">
            <h4 className="text-sm" style={{ fontWeight: 600 }}>
              Gate Status
            </h4>
          </div>
          <CardContent className="p-0">
            <div className="flex flex-col items-center py-8">
              {dashboard.gateStatus ? (
                <>
                  <Badge
                    variant="secondary"
                    className={`text-sm px-3 py-1 ${
                      dashboard.gateStatus === "passed"
                        ? "bg-green-50 text-green-700"
                        : dashboard.gateStatus === "failed"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {dashboard.gateStatus === "passed" && <CheckCircle className="size-4 mr-1.5" />}
                    {dashboard.gateStatus === "failed" && <AlertTriangle className="size-4 mr-1.5" />}
                    {dashboard.gateStatus}
                  </Badge>
                </>
              ) : (
                <>
                  <CheckCircle className="size-5 text-muted-foreground mb-1.5" />
                  <p className="text-xs text-muted-foreground">
                    No gate evaluation yet
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
