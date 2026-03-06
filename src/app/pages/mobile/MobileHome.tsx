import { useNavigate } from "react-router";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { EmptyState } from "../../components/EmptyState";
import { useProgram } from "../../context/ProgramContext";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../hooks/use-api";
import type {
  LearnerDashboardData,
  Session,
  PaginatedResponse,
  Announcement,
  RecordingWeek,
} from "../../types/api";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import {
  Clock,
  ScanLine,
  FileText,
  Video,
  AlertTriangle,
  ChevronRight,
  Folder,
  CalendarX,
  Pin,
  Megaphone,
  Play,
} from "lucide-react";

export function MobileHome() {
  const { currentProgram } = useProgram();
  const { user } = useAuth();
  const navigate = useNavigate();

  const pid = currentProgram?.id;

  const { data: dashboard, loading: dashLoading } =
    useApi<LearnerDashboardData>(pid ? `/programs/${pid}/dashboard/learner` : null, [pid]);

  const { data: sessionsData, loading: sessionsLoading } =
    useApi<PaginatedResponse<Session>>(pid ? `/programs/${pid}/sessions` : null, [pid]);

  const { data: announcementsData, loading: annLoading } =
    useApi<PaginatedResponse<Announcement>>(pid ? `/programs/${pid}/announcements` : null, [pid]);

  const { data: recordingWeeks } =
    useApi<RecordingWeek[]>(pid ? `/programs/${pid}/me/recordings` : null, [pid]);

  const loading = dashLoading || sessionsLoading || annLoading;

  if (!currentProgram) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Folder}
          title="No program selected"
          description="Select a program to get started."
        />
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const allSessions = sessionsData?.data ?? [];
  const todaySessions = allSessions.filter(
    (s) => format(parseISO(s.startAt), "yyyy-MM-dd") === todayStr
  );

  // Find the nearest upcoming mission deadline from dashboard upcomingSessions
  // (the dashboard doesn't provide missions directly, so we skip next-deadline for now)
  // Use upcoming sessions as a proxy if needed — or simply omit the deadline card.

  const hasRecordings =
    (recordingWeeks ?? []).some((rw) => rw.sessions.length > 0);

  const programAnnouncements = (announcementsData?.data ?? [])
    .filter((a) => a.status === "PUBLISHED")
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 3);

  const formatSessionTime = (s: Session) => {
    try {
      const start = format(parseISO(s.startAt), "HH:mm");
      const end = format(parseISO(s.endAt), "HH:mm");
      return `${start}-${end}`;
    } catch {
      return "";
    }
  };

  const sessionTypeDisplay = (type: Session["type"]) => {
    const map: Record<string, string> = {
      LIVE: "online",
      MAKEUP: "offline",
      DRILL: "offline",
      EVAL: "offline",
      WAR_ROOM: "offline",
    };
    return map[type] ?? "online";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-1">
        <p className="text-xs text-muted-foreground">
          {currentProgram.shortName}
        </p>
        <h2 className="text-base mt-0.5" style={{ fontWeight: 600 }}>
          Hi, {user?.name?.split(" ").pop() || "Trainee"}
        </h2>
      </div>

      {/* Progress Summary */}
      <div className="px-4 grid grid-cols-2 gap-2.5">
        <div className="border rounded-lg p-3 space-y-1.5">
          <p className="text-[11px] text-muted-foreground">Attendance</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg" style={{ fontWeight: 600 }}>
              {dashboard?.attendanceRate ?? 0}%
            </span>
          </div>
          <Progress
            value={dashboard?.attendanceRate ?? 0}
            className="h-1"
          />
        </div>
        <div className="border rounded-lg p-3 space-y-1.5">
          <p className="text-[11px] text-muted-foreground">Completion</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg" style={{ fontWeight: 600 }}>
              {dashboard?.completionRate ?? 0}%
            </span>
          </div>
          <Progress
            value={dashboard?.completionRate ?? 0}
            className="h-1"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-9 text-xs gap-1.5"
            onClick={() => navigate("/m/checkin")}
          >
            <ScanLine className="size-3.5" />
            Check-in
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 text-xs gap-1.5"
            onClick={() => navigate("/m/missions")}
          >
            <FileText className="size-3.5" />
            Tests
          </Button>
          {hasRecordings && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 text-xs gap-1.5"
              onClick={() => navigate("/m/recordings")}
            >
              <Video className="size-3.5" />
              Recordings
            </Button>
          )}
        </div>
      </div>

      {/* Announcements */}
      {programAnnouncements.length > 0 && (
        <div className="px-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Megaphone className="size-3.5 text-muted-foreground" />
            <h3 className="text-xs" style={{ fontWeight: 600 }}>
              Announcements
            </h3>
          </div>
          <div className="space-y-2">
            {programAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="border rounded-lg p-3 flex items-start gap-2.5"
              >
                <div
                  className={`size-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
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
                    <p className="text-xs" style={{ fontWeight: 500 }}>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Sessions */}
      <div>
        <div className="px-4 flex items-center justify-between mb-2">
          <h3 className="text-xs" style={{ fontWeight: 600 }}>
            Today
          </h3>
          <button
            className="text-[11px] text-primary flex items-center gap-0.5"
            style={{ fontWeight: 500 }}
            onClick={() => navigate("/m/schedule")}
          >
            All sessions <ChevronRight className="size-3" />
          </button>
        </div>
        {todaySessions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 px-4">
            No sessions today
          </p>
        ) : (
          <div className="px-4 space-y-2">
            {todaySessions.map((s) => {
              const displayType = sessionTypeDisplay(s.type);
              return (
                <div
                  key={s.id}
                  className="border rounded-lg p-3 flex items-center gap-3"
                >
                  <div
                    className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                      displayType === "online"
                        ? "bg-blue-50"
                        : displayType === "offline"
                        ? "bg-green-50"
                        : "bg-gray-100"
                    }`}
                  >
                    <Clock
                      className={`size-4 ${
                        displayType === "online"
                          ? "text-blue-600"
                          : displayType === "offline"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ fontWeight: 500 }}>
                      {s.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatSessionTime(s)} · {s.locationOrUrl ?? ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${
                        displayType === "online"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {displayType}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom spacer for tab bar */}
      <div className="h-2" />
    </div>
  );
}
