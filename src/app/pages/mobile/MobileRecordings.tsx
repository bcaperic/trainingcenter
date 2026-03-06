import { useNavigate } from "react-router";
import { Badge } from "../../components/ui/badge";
import { EmptyState } from "../../components/EmptyState";
import { useProgram } from "../../context/ProgramContext";
import { useApi } from "../../hooks/use-api";
import type { RecordingWeek } from "../../types/api";
import { format, parseISO } from "date-fns";
import {
  Play,
  Clock,
  ChevronLeft,
  Folder,
  Video,
  ExternalLink,
} from "lucide-react";

export function MobileRecordings() {
  const navigate = useNavigate();
  const { currentProgram } = useProgram();
  const pid = currentProgram?.id;

  const { data: recordingWeeks, loading } = useApi<RecordingWeek[]>(
    pid ? `/programs/${pid}/me/recordings` : null,
    [pid]
  );

  if (!currentProgram) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Folder}
          title="No program selected"
          description="Select a program to view recordings."
        />
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  const groups = (recordingWeeks ?? []).filter((rw) => rw.sessions.length > 0);

  const totalRecordings = groups.reduce(
    (sum, rw) => sum + rw.sessions.length,
    0
  );

  if (totalRecordings === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Video}
          title="No recordings yet"
          description="Session recordings will appear here."
        />
      </div>
    );
  }

  const formatSessionDate = (startAt: string) => {
    try {
      return format(parseISO(startAt), "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  const formatDuration = (startAt: string, endAt: string) => {
    try {
      const start = parseISO(startAt);
      const end = parseISO(endAt);
      const diffMin = Math.round((end.getTime() - start.getTime()) / 60000);
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      if (hours > 0) return `${hours}h ${mins}m`;
      return `${mins}m`;
    } catch {
      return "";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="size-8 rounded-lg flex items-center justify-center hover:bg-accent"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div>
          <h2 className="text-base" style={{ fontWeight: 600 }}>
            Recordings
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {totalRecordings} recording
            {totalRecordings > 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      <div className="px-4 space-y-4 pb-4">
        {groups.map((group) => {
          const weekLabel = group.week
            ? `Week ${group.week.weekNo} - ${group.week.title}`
            : "Other";
          return (
            <div key={group.weekId ?? "no-week"}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs" style={{ fontWeight: 600 }}>
                  {weekLabel}
                </h3>
                <Badge variant="secondary" className="text-[10px]">
                  {group.sessions.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {group.sessions.map((s) => (
                  <button
                    key={s.id}
                    className="w-full text-left border rounded-lg p-3 flex items-center gap-3 active:bg-accent/50 transition-colors"
                    onClick={() =>
                      s.recordingUrl &&
                      window.open(s.recordingUrl, "_blank")
                    }
                  >
                    <div className="size-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <Play className="size-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs truncate"
                        style={{ fontWeight: 500 }}
                      >
                        {s.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <span>{formatSessionDate(s.startAt)}</span>
                        <span>·</span>
                        <Clock className="size-3" />
                        <span>{formatDuration(s.startAt, s.endAt)}</span>
                      </p>
                    </div>
                    <ExternalLink className="size-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
