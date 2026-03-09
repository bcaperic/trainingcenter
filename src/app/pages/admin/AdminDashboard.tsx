import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  FloatingModal,
  FloatingModalHeader,
  FloatingModalTitle,
  FloatingModalDescription,
} from "../../components/FloatingModal";
import { useProgram } from "../../context/ProgramContext";
import { useApi } from "../../hooks/use-api";
import { EmptyState } from "../../components/EmptyState";
import type { AdminDashboardData, ActivityItem, Session, Announcement, PaginatedResponse } from "../../types/api";
import {
  TrendingUp,
  CheckCircle,
  CalendarCheck,
  Clock,
  FileText,
  CalendarClock,
  Folder,
  CalendarX,
  Video,
  Megaphone,
  Pin,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { capitalize } from "../../lib/format";

function formatSessionType(type: Session["type"]): string {
  const map: Record<string, string> = {
    LIVE: "Online",
    MAKEUP: "Makeup",
    DRILL: "Drill",
    EVAL: "Eval",
    WAR_ROOM: "War room",
  };
  return map[type] || capitalize(type);
}

function formatTimeRange(startAt: string, endAt: string): string {
  try {
    return `${format(new Date(startAt), "HH:mm")}-${format(new Date(endAt), "HH:mm")}`;
  } catch {
    return "";
  }
}

const activityIconMap: Record<string, { icon: typeof CalendarCheck; color: string }> = {
  checkin: { icon: CalendarCheck, color: "text-green-600 bg-green-50" },
  submission: { icon: FileText, color: "text-blue-600 bg-blue-50" },
  session: { icon: CalendarClock, color: "text-amber-600 bg-amber-50" },
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
    <Badge variant="secondary" className={`text-[10px] ${styles[type] || ""}`}>
      {formatSessionType(type as Session["type"])}
    </Badge>
  );
};

export function AdminDashboard() {
  const { currentProgram } = useProgram();
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const { data: dashboard, loading, error } = useApi<AdminDashboardData>(
    currentProgram ? `/programs/${currentProgram.id}/dashboard/admin` : null,
    [currentProgram?.id]
  );

  const { data: activities, loading: activityLoading, error: activityError } = useApi<ActivityItem[]>(
    currentProgram ? `/programs/${currentProgram.id}/dashboard/activity` : null,
    [currentProgram?.id]
  );

  const { data: announcementsData } = useApi<PaginatedResponse<Announcement>>(
    currentProgram ? `/programs/${currentProgram.id}/announcements?pageSize=5` : null,
    [currentProgram?.id]
  );

  const announcements = (announcementsData?.data ?? [])
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above to view the overview."
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

  const todaySessions = dashboard.todaySessions || [];

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Quick Stats — clickable */}
      <div className="grid grid-cols-3 gap-3">
        <Card
          className="gap-0 p-3 cursor-pointer hover:border-green-300 transition-colors"
          onClick={() => navigate("/admin/attendance")}
        >
          <CardContent className="p-0">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-md bg-green-50 flex items-center justify-center shrink-0">
                <TrendingUp className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Avg. Attendance</p>
                <p className="text-lg" style={{ fontWeight: 600 }}>
                  {dashboard.avgAttendanceRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="gap-0 p-3 cursor-pointer hover:border-purple-300 transition-colors"
          onClick={() => navigate("/admin/tests")}
        >
          <CardContent className="p-0">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-md bg-purple-50 flex items-center justify-center shrink-0">
                <CheckCircle className="size-4 text-purple-600" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Avg. Test Pass Rate</p>
                <p className="text-lg" style={{ fontWeight: 600 }}>
                  {dashboard.avgCompletionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="gap-0 p-3 cursor-pointer hover:border-amber-300 transition-colors"
          onClick={() => navigate("/admin/submissions")}
        >
          <CardContent className="p-0">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                <FileText className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Awaiting Review</p>
                <p className="text-lg" style={{ fontWeight: 600 }}>
                  {dashboard.pendingReviews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {/* Today's Sessions — 2 col */}
        <Card className="col-span-2 gap-0">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <h4 className="text-xs" style={{ fontWeight: 600 }}>
              Today's Sessions
            </h4>
            <Badge variant="secondary" className="text-[10px]">
              {todaySessions.length}
            </Badge>
          </div>
          <CardContent className="p-0">
            {todaySessions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No sessions today
              </p>
            ) : (
              <div className="divide-y">
                {todaySessions.map((s) => {
                  const displayType = formatSessionType(s.type);
                  return (
                    <button
                      key={s.id}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedSession(s)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ fontWeight: 500 }}>
                          {s.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="size-3" />
                          {formatTimeRange(s.startAt, s.endAt)}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] shrink-0 ${
                          s.type === "LIVE"
                            ? "bg-blue-50 text-blue-700"
                            : s.type === "DRILL"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {displayType}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements — 3 col */}
        <Card className="col-span-3 gap-0">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <h4 className="text-xs" style={{ fontWeight: 600 }}>
              Announcements
            </h4>
            <Badge variant="secondary" className="text-[10px]">
              {announcements.length}
            </Badge>
          </div>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {announcements.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No announcements
              </p>
            ) : (
              <div className="divide-y">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="px-3 py-2 flex items-start gap-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setSelectedAnnouncement(ann)}
                  >
                    <div
                      className={`size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        ann.isPinned
                          ? "bg-amber-50 text-amber-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {ann.isPinned ? (
                        <Pin className="size-3" />
                      ) : (
                        <Megaphone className="size-3" />
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
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {ann.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity — full width */}
      <Card className="gap-0">
        <div className="px-3 py-2 border-b">
          <h4 className="text-xs" style={{ fontWeight: 600 }}>
            Recent Activity
          </h4>
        </div>
        <CardContent className="p-0 max-h-52 overflow-y-auto">
          {activityLoading ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              Loading activity...
            </p>
          ) : activityError ? (
            <p className="text-xs text-red-500 text-center py-6">
              Failed to load activity
            </p>
          ) : !activities || activities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No recent activity
            </p>
          ) : (
            <div className="divide-y">
              {activities.map((a) => {
                const iconInfo = activityIconMap[a.type] || activityIconMap.session;
                const Icon = iconInfo.icon;
                let timeLabel: string;
                try {
                  timeLabel = formatDistanceToNow(new Date(a.createdAt), { addSuffix: true });
                } catch {
                  timeLabel = "";
                }
                return (
                  <div key={a.id} className="px-3 py-2 flex items-start gap-2.5">
                    <div
                      className={`size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${iconInfo.color}`}
                    >
                      <Icon className="size-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug">{a.text}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {timeLabel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Modal */}
      <FloatingModal open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
          {selectedSession && (
            <>
              <FloatingModalHeader>
                <FloatingModalTitle className="text-sm">{selectedSession.title}</FloatingModalTitle>
                <FloatingModalDescription className="text-xs">
                  {selectedSession.description || "No description"}
                </FloatingModalDescription>
              </FloatingModalHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {typeBadge(selectedSession.type)}
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${
                      selectedSession.status === "ONGOING"
                        ? "bg-green-50 text-green-700"
                        : selectedSession.status === "PUBLISHED"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {capitalize(selectedSession.status)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Date</span>
                    <p style={{ fontWeight: 500 }}>
                      {format(new Date(selectedSession.startAt), "yyyy-MM-dd")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time</span>
                    <p style={{ fontWeight: 500 }}>
                      {formatTimeRange(selectedSession.startAt, selectedSession.endAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Instructor</span>
                    <p style={{ fontWeight: 500 }}>
                      {selectedSession.instructorName || "\u2014"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location</span>
                    <p style={{ fontWeight: 500 }}>
                      {selectedSession.locationOrUrl || "\u2014"}
                    </p>
                  </div>
                </div>
                {selectedSession.recordingUrl && (
                  <a
                    href={selectedSession.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Video className="size-3" />
                    View Recording
                  </a>
                )}
              </div>
            </>
          )}
      </FloatingModal>

      {/* Announcement Detail Modal */}
      <FloatingModal open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
          {selectedAnnouncement && (
            <>
              <FloatingModalHeader>
                <FloatingModalTitle className="text-sm flex items-center gap-2">
                  {selectedAnnouncement.title}
                  {selectedAnnouncement.isPinned && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] bg-amber-50 text-amber-700 px-1 py-0"
                    >
                      Pinned
                    </Badge>
                  )}
                </FloatingModalTitle>
                <FloatingModalDescription className="text-[11px]">
                  {format(new Date(selectedAnnouncement.createdAt), "yyyy-MM-dd HH:mm")}
                </FloatingModalDescription>
              </FloatingModalHeader>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {selectedAnnouncement.body}
              </div>
            </>
          )}
      </FloatingModal>
    </div>
  );
}
