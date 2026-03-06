import { useState, useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../components/ui/sheet";
import { EmptyState } from "../../components/EmptyState";
import { useProgram } from "../../context/ProgramContext";
import { useApi, apiPost } from "../../hooks/use-api";
import type { Week, Mission } from "../../types/api";
import { format } from "date-fns";
import { FileText, Link2, Clock, Folder, CalendarX, Target } from "lucide-react";
import { toast } from "sonner";

export function LearnerMissions() {
  const { currentProgram } = useProgram();
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [submissionType, setSubmissionType] = useState<"link" | "text">("link");
  const [submissionContent, setSubmissionContent] = useState("");

  const pid = currentProgram?.id;

  const { data: weeksData, loading: loadingWeeks } =
    useApi<Week[]>(pid ? `/programs/${pid}/weeks` : null, [pid]);

  const programWeeks = weeksData ?? [];

  // Fetch missions for the selected week, or first week if "all"
  const activeWeekId = selectedWeek !== "all" ? selectedWeek : programWeeks[0]?.id ?? null;

  const { data: missionsData, loading: loadingMissions, refetch: refetchMissions } =
    useApi<Mission[]>(
      pid && activeWeekId
        ? `/programs/${pid}/missions/weeks/${activeWeekId}`
        : null,
      [pid, activeWeekId]
    );

  // When "all" is selected, we show missions from the first week (API is per-week)
  const filteredMissions = missionsData ?? [];

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above."
      />
    );
  }

  if (loadingWeeks || loadingMissions) {
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

  const statusStyle: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    submitted: "bg-blue-50 text-blue-700",
    reviewed: "bg-green-50 text-green-700",
    overdue: "bg-red-50 text-red-600",
  };

  const handleSubmit = async () => {
    if (!submissionContent.trim()) {
      toast.error("Please enter submission content");
      return;
    }
    if (!selectedMission || !pid) return;
    try {
      const body =
        submissionType === "link"
          ? { contentUrl: submissionContent.trim(), contentText: null }
          : { contentText: submissionContent.trim(), contentUrl: null };
      await apiPost(`/programs/${pid}/missions/${selectedMission.id}/submit`, body);
      toast.success("Submitted!");
      setSubmissionContent("");
      setSelectedMission(null);
      refetchMissions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Submission failed");
    }
  };

  return (
    <div className="space-y-3 max-w-3xl">
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

      {filteredMissions.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No tests"
          description="No tests found for the selected filter."
        />
      ) : (
        <div className="space-y-2">
          {filteredMissions.map((m) => {
            const status = m.userStatus ?? "pending";
            return (
              <Card
                key={m.id}
                className="gap-0 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedMission(m)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="size-8 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                    <FileText className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ fontWeight: 500 }}>
                      {m.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="size-3" />
                      Due: {m.dueAt ? format(new Date(m.dueAt), "yyyy-MM-dd") : "—"}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] shrink-0 ${statusStyle[status] || ""}`}
                  >
                    {status}
                  </Badge>
                  {(status === "pending" || status === "overdue") && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMission(m);
                      }}
                    >
                      Submit
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mission Detail */}
      <Sheet
        open={!!selectedMission}
        onOpenChange={() => setSelectedMission(null)}
      >
        <SheetContent className="sm:max-w-md">
          {selectedMission && (() => {
            const status = selectedMission.userStatus ?? "pending";
            const weekLabel = programWeeks.find((w) => w.id === selectedMission.weekId);
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-sm">
                    {selectedMission.title}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Due: {selectedMission.dueAt ? format(new Date(selectedMission.dueAt), "yyyy-MM-dd") : "—"}
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4 space-y-4 flex-1 overflow-auto">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[11px] ${statusStyle[status] || ""}`}
                    >
                      {status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {weekLabel ? `Week ${weekLabel.weekNo} - ${weekLabel.title}` : ""}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-xs leading-relaxed">
                      {selectedMission.description}
                    </p>
                  </div>

                  {(status === "pending" || status === "overdue") && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs" style={{ fontWeight: 500 }}>
                        Submit your work
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant={submissionType === "link" ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setSubmissionType("link")}
                        >
                          <Link2 className="size-3" />
                          Link
                        </Button>
                        <Button
                          variant={submissionType === "text" ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setSubmissionType("text")}
                        >
                          <FileText className="size-3" />
                          Text
                        </Button>
                      </div>
                      {submissionType === "link" ? (
                        <Input
                          placeholder="https://docs.google.com/..."
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          className="h-8 text-xs"
                        />
                      ) : (
                        <textarea
                          placeholder="Enter your submission..."
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          className="w-full h-24 text-xs border rounded-md p-2 bg-input-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      )}
                      <Button className="w-full h-8 text-sm" onClick={handleSubmit}>
                        Submit
                      </Button>
                    </div>
                  )}

                  {selectedMission.userSubmission && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs" style={{ fontWeight: 500 }}>
                        Your Submission
                      </p>
                      <div className="border rounded-md p-2.5 space-y-1 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(selectedMission.userSubmission.submittedAt), "yyyy-MM-dd HH:mm")}
                          </span>
                          {selectedMission.userSubmission.score !== null && (
                            <Badge
                              variant="secondary"
                              className={`text-[11px] ${
                                selectedMission.userSubmission.score >= 80
                                  ? "bg-green-50 text-green-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              Score: {selectedMission.userSubmission.score}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs">
                          {selectedMission.userSubmission.contentUrl ? (
                            <a
                              href={selectedMission.userSubmission.contentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Link2 className="size-3" />
                              {selectedMission.userSubmission.contentUrl}
                            </a>
                          ) : (
                            selectedMission.userSubmission.contentText
                          )}
                        </p>
                        {selectedMission.userSubmission.feedback && (
                          <div className="mt-1 pt-1 border-t">
                            <p className="text-[11px] text-muted-foreground">Feedback</p>
                            <p className="text-xs">{selectedMission.userSubmission.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
