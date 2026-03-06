import { useState, useMemo } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
import { useApi, apiPost } from "../../hooks/use-api";
import type { Week, Mission } from "../../types/api";
import { format, parseISO } from "date-fns";
import { FileText, Link2, Clock, Folder, CalendarX, Target } from "lucide-react";
import { toast } from "sonner";

const statusStyle: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  submitted: "bg-blue-50 text-blue-700",
  reviewed: "bg-green-50 text-green-700",
  overdue: "bg-red-50 text-red-600",
};

const statusLabel: Record<string, string> = {
  pending: "Not started",
  submitted: "Submitted",
  reviewed: "Reviewed",
  overdue: "Overdue",
};

export function MobileMissions() {
  const { currentProgram } = useProgram();
  const pid = currentProgram?.id;

  const [selectedWeek, setSelectedWeek] = useState("all");
  const [openMission, setOpenMission] = useState<Mission | null>(null);
  const [subType, setSubType] = useState<"link" | "text">("link");
  const [subContent, setSubContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: weeksData, loading: weeksLoading } = useApi<Week[]>(
    pid ? `/programs/${pid}/weeks` : null,
    [pid]
  );

  // Fetch missions per selected week, or all by using first week as fallback
  const { data: missionsData, loading: missionsLoading, refetch: refetchMissions } = useApi<Mission[]>(
    pid && selectedWeek !== "all"
      ? `/programs/${pid}/missions/weeks/${selectedWeek}`
      : null,
    [pid, selectedWeek]
  );

  // When "all" is selected, fetch all weeks' missions by fetching them for each week
  // For simplicity: if "all" is selected, we just show an instruction to select a week,
  // OR we fetch all weeks and collect. Let's fetch for all weeks by using a combined approach.
  // Actually, let's fetch for each week sequentially. Better: just show all missions
  // by iterating programWeeks and using a simple approach.

  const programWeeks = weeksData ?? [];

  // For "all" weeks, we need all missions. We'll do individual calls per week.
  // Since useApi can't loop, let's use a different approach:
  // Fetch missions for each week only when a week is selected. If "all", show prompt or
  // fetch all. The simplest API-compatible approach: when "all", don't pass weekId filter.
  // Looking at the API: GET /programs/:id/missions/weeks/:weekId — requires weekId.
  // So we need to fetch per week. Let's show missions only when a week is selected.

  const loading = weeksLoading || missionsLoading;
  const missions = missionsData ?? [];

  if (!currentProgram) {
    return (
      <div className="p-4">
        <EmptyState icon={Folder} title="No program" description="Select a program." />
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  if (programWeeks.length === 0) {
    return (
      <div className="p-4">
        <EmptyState icon={CalendarX} title="No weeks" description="No content yet." />
      </div>
    );
  }

  const formatDueDate = (m: Mission) => {
    if (!m.dueAt) return "No due date";
    try {
      return format(parseISO(m.dueAt), "yyyy-MM-dd");
    } catch {
      return m.dueAt;
    }
  };

  const getMissionStatus = (m: Mission): string => {
    return m.userStatus ?? "pending";
  };

  const handleSubmit = async () => {
    if (!subContent.trim()) {
      toast.error("Enter submission content");
      return;
    }
    if (!openMission || !pid) return;

    setSubmitting(true);
    try {
      const body =
        subType === "link"
          ? { contentUrl: subContent.trim() }
          : { contentText: subContent.trim() };
      await apiPost(`/programs/${pid}/missions/${openMission.id}/submit`, body);
      toast.success("Submitted!");
      setSubContent("");
      refetchMissions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-base" style={{ fontWeight: 600 }}>
          Tests
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {currentProgram.shortName}
        </p>
      </div>

      {/* Filter */}
      <div className="px-4 pb-3">
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger size="sm" className="w-full h-9">
            <SelectValue placeholder="Select a week" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Select a week</SelectItem>
            {programWeeks.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                Week {w.weekNo} - {w.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {selectedWeek === "all" ? (
        <div className="p-4">
          <EmptyState
            icon={Target}
            title="Select a week"
            description="Choose a week above to view tests."
          />
        </div>
      ) : missions.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Target}
            title="No tests"
            description="No tests for this week."
          />
        </div>
      ) : (
        <div className="px-4 space-y-2 pb-4">
          {missions.map((m) => {
            const mStatus = getMissionStatus(m);
            return (
              <button
                key={m.id}
                className="w-full border rounded-lg p-3 flex items-center gap-3 text-left active:bg-muted/30 transition-colors"
                onClick={() => setOpenMission(m)}
              >
                <div className="size-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ fontWeight: 500 }}>
                    {m.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="size-3" />
                    Due: {formatDueDate(m)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${statusStyle[mStatus] || ""}`}
                  >
                    {statusLabel[mStatus] || mStatus}
                  </Badge>
                  {m.userSubmission?.score != null && (
                    <span className="text-[10px] text-muted-foreground">
                      Score: {m.userSubmission.score}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Mission Detail Bottom Sheet */}
      <Drawer
        open={!!openMission}
        onOpenChange={(open) => !open && setOpenMission(null)}
      >
        <DrawerContent>
          {openMission && (
            <>
              <DrawerHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${
                      statusStyle[getMissionStatus(openMission)] || ""
                    }`}
                  >
                    {statusLabel[getMissionStatus(openMission)] ||
                      getMissionStatus(openMission)}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    Due: {formatDueDate(openMission)}
                  </span>
                </div>
                <DrawerTitle className="text-sm">
                  {openMission.title}
                </DrawerTitle>
                <DrawerDescription className="text-xs leading-relaxed mt-1">
                  {openMission.description}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-4 space-y-3 pb-2 max-h-[40vh] overflow-y-auto">
                {/* Submission Form */}
                {(getMissionStatus(openMission) === "pending" ||
                  getMissionStatus(openMission) === "overdue") && (
                  <div className="space-y-2.5 border-t pt-3">
                    <p className="text-xs" style={{ fontWeight: 500 }}>
                      Submit your work
                    </p>
                    <div className="flex gap-1.5">
                      <Button
                        variant={subType === "link" ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs gap-1 flex-1"
                        onClick={() => setSubType("link")}
                      >
                        <Link2 className="size-3" />
                        Link
                      </Button>
                      <Button
                        variant={subType === "text" ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs gap-1 flex-1"
                        onClick={() => setSubType("text")}
                      >
                        <FileText className="size-3" />
                        Text
                      </Button>
                    </div>
                    {subType === "link" ? (
                      <Input
                        placeholder="https://docs.google.com/..."
                        value={subContent}
                        onChange={(e) => setSubContent(e.target.value)}
                        className="h-9 text-xs"
                      />
                    ) : (
                      <textarea
                        placeholder="Enter your submission..."
                        value={subContent}
                        onChange={(e) => setSubContent(e.target.value)}
                        className="w-full h-20 text-xs border rounded-md p-2 bg-input-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    )}
                    <Button
                      className="w-full h-10 text-sm"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                )}

                {/* Submission History */}
                {openMission.userSubmission && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs" style={{ fontWeight: 500 }}>
                      Your Submission
                    </p>
                    <div className="border rounded-lg p-2.5 space-y-1 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {openMission.userSubmission.submittedAt
                            ? format(
                                parseISO(openMission.userSubmission.submittedAt),
                                "yyyy-MM-dd HH:mm"
                              )
                            : ""}
                        </span>
                        {openMission.userSubmission.score != null && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              openMission.userSubmission.score >= 80
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            Score: {openMission.userSubmission.score}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs">
                        {openMission.userSubmission.contentUrl ? (
                          <a
                            href={openMission.userSubmission.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Link2 className="size-3" />
                            {openMission.userSubmission.contentUrl}
                          </a>
                        ) : (
                          openMission.userSubmission.contentText ?? ""
                        )}
                      </p>
                      {openMission.userSubmission.feedback && (
                        <div className="mt-1 pt-1 border-t">
                          <p className="text-[10px] text-muted-foreground">
                            Feedback
                          </p>
                          <p className="text-xs mt-0.5">
                            {openMission.userSubmission.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DrawerFooter className="pt-1">
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
