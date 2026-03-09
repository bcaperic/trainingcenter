import { useState, useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  FloatingModal,
  FloatingModalHeader,
  FloatingModalTitle,
  FloatingModalDescription,
  FloatingModalFooter,
} from "../../components/FloatingModal";
import { EmptyState } from "../../components/EmptyState";
import { useProgram } from "../../context/ProgramContext";
import { useApi, apiPost, apiDelete } from "../../hooks/use-api";
import type {
  Week,
  Session,
  PaginatedResponse,
  Enrollment,
} from "../../types/api";
import { format } from "date-fns";
import { Clock, Video, ExternalLink, Folder, CalendarX, Calendar } from "lucide-react";
import { toast } from "sonner";
import { capitalize } from "../../lib/format";

function formatSessionType(type: Session["type"]): string {
  const map: Record<string, string> = {
    LIVE: "Online",
    MAKEUP: "Makeup",
    DRILL: "Drill",
    EVAL: "Eval",
    WAR_ROOM: "War Room",
  };
  return map[type] || capitalize(type);
}

export function LearnerSchedule() {
  const { currentProgram } = useProgram();
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const pid = currentProgram?.id;

  const { data: weeksData, loading: loadingWeeks } =
    useApi<Week[]>(pid ? `/programs/${pid}/weeks` : null, [pid]);

  const { data: sessionsData, loading: loadingSessions } =
    useApi<PaginatedResponse<Session>>(pid ? `/programs/${pid}/sessions` : null, [pid]);

  const { data: enrollments, refetch: refetchEnrollments } =
    useApi<Enrollment[]>(pid ? `/programs/${pid}/me/enrollments` : null, [pid]);

  const programWeeks = weeksData ?? [];
  const allSessions = sessionsData?.data ?? [];

  const enrolledSessionIds = useMemo(() => {
    const set = new Set<string>();
    (enrollments ?? []).forEach((e) => {
      if (e.status !== "CANCELED") set.add(e.sessionId);
    });
    return set;
  }, [enrollments]);

  const programSessions = useMemo(() => {
    let filtered = allSessions;
    if (selectedWeek !== "all") {
      filtered = filtered.filter((s) => s.weekId === selectedWeek);
    }
    return filtered;
  }, [allSessions, selectedWeek]);

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above."
      />
    );
  }

  if (loadingWeeks || loadingSessions) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (programWeeks.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No weeks created"
        description={`"${currentProgram.name}" has no scheduled weeks yet.`}
      />
    );
  }

  const sessionTypeStyle = (type: string) => {
    switch (type) {
      case "LIVE":
        return { bg: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-50 text-blue-700" };
      case "MAKEUP":
        return { bg: "bg-green-50", text: "text-green-600", badge: "bg-green-50 text-green-700" };
      case "DRILL":
        return { bg: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-50 text-emerald-700" };
      case "EVAL":
        return { bg: "bg-purple-50", text: "text-purple-600", badge: "bg-purple-50 text-purple-700" };
      case "WAR_ROOM":
        return { bg: "bg-gray-100", text: "text-gray-500", badge: "bg-gray-100 text-gray-600" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-500", badge: "bg-gray-100 text-gray-600" };
    }
  };

  const isRecordingType = (type: string) =>
    type === "DRILL" || type === "WAR_ROOM";

  const handleEnroll = async (sessionId: string) => {
    try {
      if (enrolledSessionIds.has(sessionId)) {
        await apiDelete(`/programs/${pid}/sessions/${sessionId}/enroll`);
        toast("Enrollment cancelled");
      } else {
        await apiPost(`/programs/${pid}/sessions/${sessionId}/enroll`);
        toast.success("Enrolled!");
      }
      refetchEnrollments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed");
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PUBLISHED: "bg-blue-50 text-blue-700",
      ONGOING: "bg-green-50 text-green-700",
      ENDED: "bg-gray-100 text-gray-600",
      CANCELED: "bg-red-50 text-red-700",
      DRAFT: "bg-yellow-50 text-yellow-700",
    };
    return (
      <Badge variant="secondary" className={`text-[10px] ${styles[status] || ""}`}>
        {capitalize(status)}
      </Badge>
    );
  };

  return (
    <div className="space-y-3 max-w-3xl">
      {/* Filter */}
      <Select value={selectedWeek} onValueChange={setSelectedWeek}>
        <SelectTrigger size="sm" className="w-44">
          <SelectValue placeholder="All Weeks" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Weeks</SelectItem>
          {programWeeks.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              Week {w.weekNo} - {w.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {programSessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions available"
          description="No sessions found for the selected filter."
        />
      ) : (
        <div className="space-y-2">
          {programSessions.map((s) => {
            const style = sessionTypeStyle(s.type);
            return (
              <Card
                key={s.id}
                className="gap-0 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedSession(s)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className={`size-9 rounded-md flex items-center justify-center shrink-0 ${style.bg}`}
                  >
                    {isRecordingType(s.type) ? (
                      <Video className="size-4 text-gray-500" />
                    ) : (
                      <Clock className={`size-4 ${style.text}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ fontWeight: 500 }}>
                      {s.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {format(new Date(s.startAt), "yyyy-MM-dd")} ·{" "}
                      {format(new Date(s.startAt), "HH:mm")}–{format(new Date(s.endAt), "HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${style.badge}`}
                    >
                      {formatSessionType(s.type as Session["type"])}
                    </Badge>
                    {enrolledSessionIds.has(s.id) && (
                      <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                        Enrolled
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Session Detail Modal */}
      <FloatingModal
        open={!!selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
      >
        {selectedSession && (
          <>
            <FloatingModalHeader>
              <FloatingModalTitle className="text-sm">
                {selectedSession.title}
              </FloatingModalTitle>
              <FloatingModalDescription className="text-xs">
                {selectedSession.description || "No description"}
              </FloatingModalDescription>
            </FloatingModalHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-[11px] ${sessionTypeStyle(selectedSession.type).badge}`}
                >
                  {formatSessionType(selectedSession.type as Session["type"])}
                </Badge>
                {statusBadge(selectedSession.status)}
                {enrolledSessionIds.has(selectedSession.id) && (
                  <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                    Enrolled
                  </Badge>
                )}
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
                    {format(new Date(selectedSession.startAt), "HH:mm")}–
                    {format(new Date(selectedSession.endAt), "HH:mm")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location</span>
                  <p style={{ fontWeight: 500 }}>
                    {selectedSession.locationOrUrl || "\u2014"}
                  </p>
                </div>
              </div>
              {selectedSession.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-xs leading-relaxed">{selectedSession.description}</p>
                </div>
              )}
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
            <FloatingModalFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSession(null)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                variant={
                  enrolledSessionIds.has(selectedSession.id) ? "outline" : "default"
                }
                onClick={() => handleEnroll(selectedSession.id)}
                className="text-xs"
              >
                {enrolledSessionIds.has(selectedSession.id)
                  ? "Cancel Enrollment"
                  : "Enroll Now"}
              </Button>
            </FloatingModalFooter>
          </>
        )}
      </FloatingModal>
    </div>
  );
}
