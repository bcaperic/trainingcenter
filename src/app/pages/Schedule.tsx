import { useState, useMemo } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
import type { Session, Week, PaginatedResponse, Team } from "../types/api";
import { Search, ExternalLink, Video, Folder, CalendarX, Calendar } from "lucide-react";
import { format } from "date-fns";

function formatTimeRange(startAt: string, endAt: string): string {
  try {
    return `${format(new Date(startAt), "HH:mm")}-${format(new Date(endAt), "HH:mm")}`;
  } catch {
    return "";
  }
}

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

export function Schedule() {
  const { currentProgram } = useProgram();
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const { data: weeks } = useApi<Week[]>(
    currentProgram ? `/programs/${currentProgram.id}/weeks` : null,
    [currentProgram?.id]
  );

  const { data: teams } = useApi<Team[]>(
    currentProgram ? `/programs/${currentProgram.id}/teams` : null,
    [currentProgram?.id]
  );

  const weekIdParam = selectedWeek !== "all" ? `?weekId=${selectedWeek}` : "";

  const { data: sessionsData, loading, error, refetch } = useApi<PaginatedResponse<Session>>(
    currentProgram ? `/programs/${currentProgram.id}/sessions${weekIdParam}` : null,
    [currentProgram?.id, selectedWeek]
  );

  const weeksList = weeks ?? [];
  const teamsList = teams ?? [];
  const sessionsList = sessionsData?.data ?? [];

  const filteredSessions = useMemo(() => {
    if (!search) return sessionsList;
    const q = search.toLowerCase();
    return sessionsList.filter(
      (s) => s.title.toLowerCase().includes(q)
    );
  }, [sessionsList, search]);

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above to view sessions."
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
        {status.toLowerCase()}
      </Badge>
    );
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
      <Badge variant="secondary" className={`text-[11px] ${styles[type] || ""}`}>
        {formatSessionType(type as Session["type"])}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
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
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Sessions Table or Empty */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions available"
          description={
            selectedWeek !== "all"
              ? "No sessions found for this week. Try selecting a different week."
              : "No sessions have been scheduled for this program yet."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-xs">Date / Time</TableHead>
              <TableHead className="h-8 text-xs">Type</TableHead>
              <TableHead className="h-8 text-xs">Title</TableHead>
              <TableHead className="h-8 text-xs">Capacity</TableHead>
              <TableHead className="h-8 text-xs w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.map((session) => (
              <TableRow
                key={session.id}
                className="cursor-pointer h-9"
                onClick={() => setSelectedSession(session)}
              >
                <TableCell className="py-1.5 text-xs">
                  <div>{format(new Date(session.startAt), "yyyy-MM-dd")}</div>
                  <div className="text-muted-foreground">
                    {formatTimeRange(session.startAt, session.endAt)}
                  </div>
                </TableCell>
                <TableCell className="py-1.5">{typeBadge(session.type)}</TableCell>
                <TableCell className="py-1.5 text-xs" style={{ fontWeight: 500 }}>
                  {session.title}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-muted-foreground">
                  {session.capacity
                    ? `${session.enrolledCount ?? 0}/${session.capacity}`
                    : "\u2014"}
                </TableCell>
                <TableCell className="py-1.5">
                  {session.recordingUrl ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(session.recordingUrl!, "_blank");
                      }}
                    >
                      <Video className="size-3" />
                      Watch
                    </Button>
                  ) : (
                    statusBadge(session.status)
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {typeBadge(selectedSession.type)}
                {statusBadge(selectedSession.status)}
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
                  <span className="text-muted-foreground">Capacity</span>
                  <p style={{ fontWeight: 500 }}>
                    {selectedSession.capacity
                      ? `${selectedSession.enrolledCount ?? 0}/${selectedSession.capacity}`
                      : "\u2014"}
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
          </>
        )}
      </FloatingModal>
    </div>
  );
}
