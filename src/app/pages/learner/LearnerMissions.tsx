import { useState, useMemo, useRef } from "react";
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
  FloatingModal,
  FloatingModalHeader,
  FloatingModalTitle,
  FloatingModalDescription,
  FloatingModalFooter,
} from "../../components/FloatingModal";
import { EmptyState } from "../../components/EmptyState";
import { useProgram } from "../../context/ProgramContext";
import { useApi } from "../../hooks/use-api";
import api from "../../lib/api-client";
import type { Week, Mission } from "../../types/api";
import { format } from "date-fns";
import {
  FileText,
  Link2,
  Clock,
  Folder,
  CalendarX,
  Target,
  Paperclip,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { capitalize } from "../../lib/format";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LearnerMissions() {
  const { currentProgram } = useProgram();
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [submissionType, setSubmissionType] = useState<"link" | "text">("link");
  const [submissionContent, setSubmissionContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pid = currentProgram?.id;

  const { data: weeksData, loading: loadingWeeks } =
    useApi<Week[]>(pid ? `/programs/${pid}/weeks` : null, [pid]);

  const programWeeks = weeksData ?? [];

  const activeWeekId =
    selectedWeek !== "all" ? selectedWeek : programWeeks[0]?.id ?? null;

  const {
    data: missionsData,
    loading: loadingMissions,
    refetch: refetchMissions,
  } = useApi<Mission[]>(
    pid && activeWeekId
      ? `/programs/${pid}/missions/weeks/${activeWeekId}`
      : null,
    [pid, activeWeekId]
  );

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
    PASS: "bg-green-50 text-green-700",
    FAIL: "bg-red-50 text-red-600",
    RETURNED: "bg-amber-50 text-amber-700",
  };

  const handleSubmit = async () => {
    if (!submissionContent.trim() && !selectedFile) {
      toast.error("Please enter submission content or attach a file");
      return;
    }
    if (!selectedMission || !pid) return;
    setSubmitting(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (submissionType === "link" && submissionContent.trim()) {
          formData.append("contentUrl", submissionContent);
        } else if (submissionType === "text" && submissionContent.trim()) {
          formData.append("contentText", submissionContent);
        }
        await api.post(
          `/programs/${pid}/missions/${selectedMission.id}/submit-with-file`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        await api.post(
          `/programs/${pid}/missions/${selectedMission.id}/submit`,
          {
            contentUrl: submissionType === "link" ? submissionContent : null,
            contentText: submissionType === "text" ? submissionContent : null,
          }
        );
      }
      toast.success("Submitted successfully!");
      setSubmissionContent("");
      setSelectedFile(null);
      setSelectedMission(null);
      refetchMissions();
    } catch {
      toast.error("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadAttachment = (
    submissionId: string,
    attachmentId: string
  ) => {
    const token = localStorage.getItem("accessToken");
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
    window.open(
      `${baseUrl}/programs/${pid}/submissions/${submissionId}/attachments/${attachmentId}/download?token=${token}`,
      "_blank"
    );
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
                      Due: {m.dueAt ? format(new Date(m.dueAt), "yyyy-MM-dd") : "\u2014"}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] shrink-0 ${statusStyle[status] || ""}`}
                  >
                    {capitalize(status)}
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

      {/* Mission Detail Modal */}
      <FloatingModal
        open={!!selectedMission}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMission(null);
            setSubmissionContent("");
            setSelectedFile(null);
          }
        }}
      >
        {selectedMission &&
          (() => {
            const status = selectedMission.userStatus ?? "pending";
            const weekLabel = programWeeks.find(
              (w) => w.id === selectedMission.weekId
            );
            return (
              <>
                <FloatingModalHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="secondary"
                      className={`text-[11px] ${statusStyle[status] || ""}`}
                    >
                      {capitalize(status)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {weekLabel
                        ? `Week ${weekLabel.weekNo} - ${weekLabel.title}`
                        : ""}
                    </span>
                  </div>
                  <FloatingModalTitle className="text-sm">
                    {selectedMission.title}
                  </FloatingModalTitle>
                  <FloatingModalDescription className="text-xs">
                    Due:{" "}
                    {selectedMission.dueAt
                      ? format(new Date(selectedMission.dueAt), "yyyy-MM-dd")
                      : "\u2014"}
                  </FloatingModalDescription>
                </FloatingModalHeader>
                <div className="space-y-4">
                  {/* Description */}
                  {selectedMission.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Description
                      </p>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">
                        {selectedMission.description}
                      </p>
                    </div>
                  )}

                  {/* Reference Files */}
                  {selectedMission.attachments &&
                    selectedMission.attachments.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          Reference Files
                        </p>
                        {selectedMission.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-2 border rounded px-2 py-1.5 bg-muted/20"
                          >
                            <Folder className="size-3 text-muted-foreground shrink-0" />
                            <span className="text-xs truncate flex-1">
                              {att.filename}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatFileSize(att.size)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0"
                              onClick={async () => {
                                try {
                                  const res = await api.get(
                                    `/programs/${pid}/missions/${selectedMission.id}/attachments/${att.id}/download`,
                                    { responseType: "blob" }
                                  );
                                  const url = window.URL.createObjectURL(
                                    new Blob([res.data])
                                  );
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = att.filename;
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                } catch {
                                  toast.error("Download failed");
                                }
                              }}
                            >
                              <Download className="size-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Submission Form */}
                  {(status === "pending" ||
                    status === "overdue" ||
                    !selectedMission.userStatus) && (
                    <div className="space-y-3 pt-3 border-t">
                      <p className="text-xs" style={{ fontWeight: 500 }}>
                        Submit your work
                      </p>
                      <div className="flex gap-1.5">
                        <Button
                          variant={
                            submissionType === "link" ? "default" : "outline"
                          }
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setSubmissionType("link")}
                        >
                          <Link2 className="size-3" />
                          Link
                        </Button>
                        <Button
                          variant={
                            submissionType === "text" ? "default" : "outline"
                          }
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
                          className="h-9 text-xs"
                        />
                      ) : (
                        <textarea
                          placeholder="Enter your submission..."
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          className="w-full text-xs border rounded-md p-3 bg-input-background resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
                          style={{ minHeight: "200px" }}
                        />
                      )}

                      {/* File attachment */}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error("File must be under 10 MB");
                                return;
                              }
                              setSelectedFile(file);
                            }
                          }}
                        />
                        {selectedFile ? (
                          <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/20">
                            <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs truncate flex-1">
                              {selectedFile.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatFileSize(selectedFile.size)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0"
                              onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Paperclip className="size-3" />
                            Attach file (max 10 MB)
                          </Button>
                        )}
                      </div>

                      <Button
                        className="w-full h-9 text-sm"
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? "Submitting..." : "Submit"}
                      </Button>
                    </div>
                  )}

                  {/* Submission History */}
                  {selectedMission.userSubmission && (
                    <div className="space-y-2 pt-3 border-t">
                      <p className="text-xs" style={{ fontWeight: 500 }}>
                        Your Submission
                      </p>
                      <div className="border rounded-md p-3 space-y-2 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            Submitted:{" "}
                            {format(
                              new Date(
                                selectedMission.userSubmission.submittedAt
                              ),
                              "yyyy-MM-dd HH:mm"
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${
                                selectedMission.userSubmission.status ===
                                  "PASS" ||
                                selectedMission.userSubmission.status ===
                                  "REVIEWED"
                                  ? "bg-green-50 text-green-700"
                                  : selectedMission.userSubmission.status ===
                                      "FAIL" ||
                                    selectedMission.userSubmission.status ===
                                      "RETURNED"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {capitalize(
                                selectedMission.userSubmission.status
                              )}
                            </Badge>
                            {selectedMission.userSubmission.score !== null && (
                              <Badge
                                variant="secondary"
                                className={`text-[10px] ${
                                  selectedMission.userSubmission.score >= 80
                                    ? "bg-green-50 text-green-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                Score: {selectedMission.userSubmission.score}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs">
                          {selectedMission.userSubmission.contentUrl ? (
                            <a
                              href={
                                selectedMission.userSubmission.contentUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Link2 className="size-3" />
                              {selectedMission.userSubmission.contentUrl}
                            </a>
                          ) : selectedMission.userSubmission.contentText ? (
                            <p className="whitespace-pre-wrap bg-background rounded p-2 border text-xs">
                              {selectedMission.userSubmission.contentText}
                            </p>
                          ) : null}
                        </div>

                        {/* Attached files */}
                        {selectedMission.userSubmission.attachments &&
                          selectedMission.userSubmission.attachments.length >
                            0 && (
                            <div className="space-y-1 pt-1">
                              <p className="text-[11px] text-muted-foreground">
                                Attached files
                              </p>
                              {selectedMission.userSubmission.attachments.map(
                                (att) => (
                                  <div
                                    key={att.id}
                                    className="flex items-center gap-2 border rounded px-2 py-1.5 bg-background"
                                  >
                                    <Paperclip className="size-3 text-muted-foreground shrink-0" />
                                    <span className="text-xs truncate flex-1">
                                      {att.filename}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                      {formatFileSize(att.size)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 shrink-0"
                                      onClick={() =>
                                        handleDownloadAttachment(
                                          selectedMission.userSubmission!.id,
                                          att.id
                                        )
                                      }
                                    >
                                      <Download className="size-3" />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                        {selectedMission.userSubmission.feedback && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-[11px] text-muted-foreground mb-1">
                              Instructor Feedback
                            </p>
                            <p className="text-xs whitespace-pre-wrap">
                              {selectedMission.userSubmission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
      </FloatingModal>
    </div>
  );
}
