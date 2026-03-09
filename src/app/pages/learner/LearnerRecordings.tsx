import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { EmptyState } from "../../components/EmptyState";
import { useProgram } from "../../context/ProgramContext";
import { useApi } from "../../hooks/use-api";
import type { RecordingWeek } from "../../types/api";
import { format } from "date-fns";
import {
  Video,
  Play,
  Clock,
  Folder,
  ExternalLink,
} from "lucide-react";
import { Button } from "../../components/ui/button";

export function LearnerRecordings() {
  const { currentProgram } = useProgram();

  const pid = currentProgram?.id;

  const { data: recordingWeeks, loading } =
    useApi<RecordingWeek[]>(pid ? `/programs/${pid}/me/recordings` : null, [pid]);

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above."
      />
    );
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  const groups = (recordingWeeks ?? []).filter((g) => g.sessions.length > 0);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Video}
        title="No recordings yet"
        description={`"${currentProgram.name}" has no videos available yet.`}
      />
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h3 className="text-sm" style={{ fontWeight: 600 }}>
          Videos
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Session recordings grouped by week.
        </p>
      </div>

      {groups.map((group) => {
        const weekLabel = group.week
          ? `Week ${group.week.weekNo} - ${group.week.title}`
          : "Unassigned";
        return (
          <Card key={group.weekId ?? "no-week"} className="gap-0">
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <h4 className="text-xs" style={{ fontWeight: 600 }}>
                {weekLabel}
              </h4>
              <Badge variant="secondary" className="text-[10px]">
                {group.sessions.length} recording{group.sessions.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <CardContent className="p-0">
              <div className="divide-y">
                {group.sessions.map((session) => {
                  const startDate = format(new Date(session.startAt), "yyyy-MM-dd");
                  const startTime = format(new Date(session.startAt), "HH:mm");
                  const endTime = format(new Date(session.endAt), "HH:mm");
                  return (
                    <div
                      key={session.id}
                      className="px-3 py-2.5 flex items-center gap-3"
                    >
                      <div className="size-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                        <Play className="size-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ fontWeight: 500 }}>
                          {session.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <span>{startDate}</span>
                          <span>·</span>
                          <Clock className="size-3 inline" />
                          <span>{startTime}–{endTime}</span>
                        </p>
                      </div>
                      {session.recordingUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1 shrink-0"
                          onClick={() => window.open(session.recordingUrl!, "_blank")}
                        >
                          <ExternalLink className="size-3" />
                          Watch
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
