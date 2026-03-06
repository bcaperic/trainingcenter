import { useState, useMemo } from "react";
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "../../components/ui/drawer";
import { EmptyState } from "../../components/EmptyState";
import { useProgram } from "../../context/ProgramContext";
import { useApi, apiPost, apiDelete } from "../../hooks/use-api";
import type {
  Session,
  Week,
  PaginatedResponse,
  Enrollment,
} from "../../types/api";
import { format, parseISO } from "date-fns";
import {
  Clock,
  Video,
  ExternalLink,
  CalendarPlus,
  MapPin,
  Folder,
  CalendarX,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "sonner";

export function MobileSchedule() {
  const { currentProgram } = useProgram();
  const pid = currentProgram?.id;

  const [selectedWeek, setSelectedWeek] = useState("all");
  const [openSession, setOpenSession] = useState<Session | null>(null);

  const { data: weeksData, loading: weeksLoading } = useApi<Week[]>(
    pid ? `/programs/${pid}/weeks` : null,
    [pid]
  );

  const { data: sessionsData, loading: sessionsLoading } =
    useApi<PaginatedResponse<Session>>(
      pid ? `/programs/${pid}/sessions` : null,
      [pid]
    );

  const {
    data: enrollments,
    loading: enrollLoading,
    refetch: refetchEnrollments,
  } = useApi<Enrollment[]>(pid ? `/programs/${pid}/me/enrollments` : null, [
    pid,
  ]);

  const loading = weeksLoading || sessionsLoading || enrollLoading;

  const programWeeks = weeksData ?? [];
  const allSessions = sessionsData?.data ?? [];

  const enrolledSessionIds = useMemo(() => {
    const set = new Set<string>();
    (enrollments ?? []).forEach((e) => {
      if (e.status !== "CANCELED") set.add(e.sessionId);
    });
    return set;
  }, [enrollments]);

  const filtered = useMemo(() => {
    let list = allSessions;
    if (selectedWeek !== "all") {
      list = list.filter((s) => s.weekId === selectedWeek);
    }
    return list;
  }, [allSessions, selectedWeek]);

  if (!currentProgram) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Folder}
          title="No program"
          description="Select a program."
        />
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  if (programWeeks.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={CalendarX}
          title="No weeks"
          description="No content yet."
        />
      </div>
    );
  }

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

  const formatSessionDate = (s: Session) => {
    try {
      return format(parseISO(s.startAt), "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  const formatSessionTime = (s: Session) => {
    try {
      const start = format(parseISO(s.startAt), "HH:mm");
      const end = format(parseISO(s.endAt), "HH:mm");
      return `${start}-${end}`;
    } catch {
      return "";
    }
  };

  const typeBadge = (type: Session["type"]) => {
    const displayType = sessionTypeDisplay(type);
    const c: Record<string, string> = {
      online: "bg-blue-50 text-blue-700",
      offline: "bg-green-50 text-green-700",
      recording: "bg-gray-100 text-gray-600",
    };
    return (
      <Badge
        variant="secondary"
        className={`text-[10px] ${c[displayType] || ""}`}
      >
        {displayType}
      </Badge>
    );
  };

  const handleEnroll = async (sessionId: string) => {
    const isEnrolled = enrolledSessionIds.has(sessionId);
    try {
      if (isEnrolled) {
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

  const handleAddCalendar = (_s: Session) => {
    toast.success("Added to calendar");
  };

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-base" style={{ fontWeight: 600 }}>
          Schedule
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {currentProgram.shortName}
        </p>
      </div>

      {/* Week Filter */}
      <div className="px-4 pb-3">
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger size="sm" className="w-full h-9">
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
      </div>

      {/* Session List */}
      {filtered.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Calendar}
            title="No sessions"
            description="No sessions for this filter."
          />
        </div>
      ) : (
        <div className="px-4 space-y-2 pb-4">
          {filtered.map((s) => {
            const displayType = sessionTypeDisplay(s.type);
            const isRecording = s.recordingUrl && s.status === "ENDED";
            return (
              <button
                key={s.id}
                className="w-full border rounded-lg p-3 flex items-center gap-3 text-left active:bg-muted/30 transition-colors"
                onClick={() => setOpenSession(s)}
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
                  {isRecording ? (
                    <Video className="size-4 text-gray-500" />
                  ) : (
                    <Clock
                      className={`size-4 ${
                        displayType === "online"
                          ? "text-blue-600"
                          : "text-green-600"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ fontWeight: 500 }}>
                    {s.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatSessionDate(s)} · {formatSessionTime(s)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {typeBadge(s.type)}
                  {enrolledSessionIds.has(s.id) && (
                    <span
                      className="text-[10px] text-primary"
                      style={{ fontWeight: 500 }}
                    >
                      Enrolled
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Sheet Detail */}
      <Drawer
        open={!!openSession}
        onOpenChange={(open) => !open && setOpenSession(null)}
      >
        <DrawerContent>
          {openSession && (
            <>
              <DrawerHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  {typeBadge(openSession.type)}
                  {enrolledSessionIds.has(openSession.id) && (
                    <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                      Enrolled
                    </Badge>
                  )}
                </div>
                <DrawerTitle className="text-sm">
                  {openSession.title}
                </DrawerTitle>
                <DrawerDescription className="text-xs">
                  {openSession.description}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-4 space-y-3 pb-2">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Date</p>
                      <p className="text-xs" style={{ fontWeight: 500 }}>
                        {formatSessionDate(openSession)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Time</p>
                      <p className="text-xs" style={{ fontWeight: 500 }}>
                        {formatSessionTime(openSession)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="size-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        Location
                      </p>
                      <p className="text-xs" style={{ fontWeight: 500 }}>
                        {openSession.locationOrUrl ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        Capacity
                      </p>
                      <p className="text-xs" style={{ fontWeight: 500 }}>
                        {openSession.enrolledCount ?? 0}
                        {openSession.capacity
                          ? `/${openSession.capacity}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-xs leading-relaxed">
                    {openSession.description}
                  </p>
                </div>

                {/* Recording Link */}
                {openSession.recordingUrl && (
                  <a
                    href={openSession.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border rounded-lg p-3 text-xs text-primary active:bg-muted/30 transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    <ExternalLink className="size-4" />
                    View Recording
                  </a>
                )}
              </div>

              <DrawerFooter className="pt-2 gap-2">
                {openSession.status !== "ENDED" &&
                  openSession.status !== "CANCELED" && (
                    <Button
                      className="w-full h-10 text-sm"
                      variant={
                        enrolledSessionIds.has(openSession.id)
                          ? "outline"
                          : "default"
                      }
                      onClick={() => handleEnroll(openSession.id)}
                    >
                      {enrolledSessionIds.has(openSession.id)
                        ? "Cancel Enrollment"
                        : "Enroll Now"}
                    </Button>
                  )}
                <Button
                  variant="outline"
                  className="w-full h-10 text-sm gap-1.5"
                  onClick={() => handleAddCalendar(openSession)}
                >
                  <CalendarPlus className="size-4" />
                  Add to Calendar
                </Button>
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    className="w-full h-9 text-xs text-muted-foreground"
                  >
                    Close
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
