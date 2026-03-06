import { useNavigate } from "react-router";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { EmptyState } from "../../components/EmptyState";
import { useProgram } from "../../context/ProgramContext";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../hooks/use-api";
import type {
  LearnerDashboardData,
  PaginatedResponse,
  Announcement,
  Notification,
} from "../../types/api";
import { format, differenceInCalendarDays } from "date-fns";
import {
  Clock,
  AlertTriangle,
  Folder,
  CalendarX,
  Star,
  Target,
  Calendar,
  ChevronRight,
  Pin,
  Megaphone,
} from "lucide-react";

export function LearnerHome() {
  const { currentProgram } = useProgram();
  const { user } = useAuth();
  const navigate = useNavigate();

  const pid = currentProgram?.id;

  const { data: dashboard, loading: loadingDash } =
    useApi<LearnerDashboardData>(pid ? `/programs/${pid}/dashboard/learner` : null, [pid]);

  const { data: annData, loading: loadingAnn } =
    useApi<PaginatedResponse<Announcement>>(pid ? `/programs/${pid}/announcements` : null, [pid]);

  const { data: notifData } =
    useApi<PaginatedResponse<Notification>>(pid ? `/programs/${pid}/me/notifications` : null, [pid]);

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above."
      />
    );
  }

  if (loadingDash || loadingAnn) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (!dashboard) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No data yet"
        description={`"${currentProgram.name}" has no dashboard data available.`}
      />
    );
  }

  const todaySessions = (dashboard.upcomingSessions ?? []).filter((s) => {
    const sessionDate = format(new Date(s.startAt), "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");
    return sessionDate === today;
  });

  const programAnnouncements = (annData?.data ?? [])
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 3);

  const sessionTypeStyle = (type: string) => {
    switch (type) {
      case "LIVE":
        return { bg: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-50 text-blue-700" };
      case "MAKEUP":
        return { bg: "bg-green-50", text: "text-green-600", badge: "bg-green-50 text-green-700" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-500", badge: "bg-gray-100 text-gray-600" };
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Greeting + Quick Stats */}
      <div>
        <h3 className="text-sm" style={{ fontWeight: 600 }}>
          Welcome back, {user?.name?.split(" ").pop() || "Trainee"}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {currentProgram.name} — Here's your overview for today.
        </p>
      </div>

      {/* Personal Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="gap-0 p-3">
          <CardContent className="p-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">Attendance</p>
              <Calendar className="size-3.5 text-blue-500" />
            </div>
            <p className="text-lg" style={{ fontWeight: 600 }}>
              {dashboard.attendanceRate}%
            </p>
            <Progress value={dashboard.attendanceRate} className="h-1" />
          </CardContent>
        </Card>
        <Card className="gap-0 p-3">
          <CardContent className="p-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">Tests</p>
              <Target className="size-3.5 text-green-500" />
            </div>
            <p className="text-lg" style={{ fontWeight: 600 }}>
              {dashboard.completionRate}%
            </p>
            <Progress value={dashboard.completionRate} className="h-1" />
          </CardContent>
        </Card>
        <Card className="gap-0 p-3">
          <CardContent className="p-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">Points</p>
              <Star className="size-3.5 text-amber-500" />
            </div>
            <p className="text-lg" style={{ fontWeight: 600 }}>
              {dashboard.points ?? 0}
            </p>
            <div className="flex items-center gap-1">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      {programAnnouncements.length > 0 && (
        <Card className="gap-0">
          <div className="px-3 py-2 border-b flex items-center gap-2">
            <Megaphone className="size-3.5 text-muted-foreground" />
            <h4 className="text-xs" style={{ fontWeight: 600 }}>
              Announcements
            </h4>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {programAnnouncements.map((ann) => (
                <div key={ann.id} className="px-3 py-2.5 flex items-start gap-2.5">
                  <div
                    className={`size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      ann.isPinned ? "bg-amber-50" : "bg-gray-100"
                    }`}
                  >
                    {ann.isPinned ? (
                      <Pin className="size-3 text-amber-600" />
                    ) : (
                      <Megaphone className="size-3 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs truncate" style={{ fontWeight: 500 }}>
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
                      {ann.publishedAt
                        ? format(new Date(ann.publishedAt), "MMM d, yyyy")
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Sessions */}
      <Card className="gap-0">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <h4 className="text-xs" style={{ fontWeight: 600 }}>
            Today's Sessions
          </h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] text-muted-foreground gap-0.5 px-1.5"
            onClick={() => navigate("/learn/schedule")}
          >
            View all <ChevronRight className="size-3" />
          </Button>
        </div>
        <CardContent className="p-0">
          {todaySessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No sessions scheduled today
            </p>
          ) : (
            <div className="divide-y">
              {todaySessions.map((s) => {
                const style = sessionTypeStyle(s.type);
                return (
                  <div key={s.id} className="px-3 py-2.5 flex items-center gap-3">
                    <div
                      className={`size-8 rounded-md flex items-center justify-center shrink-0 ${style.bg}`}
                    >
                      <Clock className={`size-4 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ fontWeight: 500 }}>
                        {s.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(s.startAt), "HH:mm")}–{format(new Date(s.endAt), "HH:mm")} · {s.capacity ?? "—"}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${style.badge}`}
                    >
                      {s.type}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Sessions (next few days) */}
      <Card className="gap-0">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <h4 className="text-xs" style={{ fontWeight: 600 }}>
            Upcoming Sessions
          </h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] text-muted-foreground gap-0.5 px-1.5"
            onClick={() => navigate("/learn/schedule")}
          >
            View all <ChevronRight className="size-3" />
          </Button>
        </div>
        <CardContent className="p-0">
          {(dashboard.upcomingSessions ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No upcoming sessions
            </p>
          ) : (
            <div className="divide-y">
              {(dashboard.upcomingSessions ?? []).map((s) => {
                const daysLeft = differenceInCalendarDays(new Date(s.startAt), new Date());
                return (
                  <div key={s.id} className="px-3 py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ fontWeight: 500 }}>
                        {s.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(s.startAt), "yyyy-MM-dd")} · {format(new Date(s.startAt), "HH:mm")}–{format(new Date(s.endAt), "HH:mm")}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] shrink-0 ${
                        daysLeft <= 1
                          ? "bg-red-50 text-red-600"
                          : daysLeft <= 3
                          ? "bg-amber-50 text-amber-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {daysLeft <= 1 && <AlertTriangle className="size-3 mr-0.5" />}
                      {daysLeft}d away
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
