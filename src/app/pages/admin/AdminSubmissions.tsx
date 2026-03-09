import { useState, useMemo } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  FloatingModal,
  FloatingModalHeader,
  FloatingModalTitle,
  FloatingModalDescription,
  FloatingModalFooter,
} from "../../components/FloatingModal";
import { useProgram } from "../../context/ProgramContext";
import { useApi, apiPut } from "../../hooks/use-api";
import api from "../../lib/api-client";
import type {
  Week,
  Mission,
  SubmissionWithUser,
  PaginatedResponse,
  SubmissionAttachment,
} from "../../types/api";
import {
  Search,
  Folder,
  ClipboardList,
  Eye,
  Download,
  FileText,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { EmptyState } from "../../components/EmptyState";
import { capitalize } from "../../lib/format";

const statusStyles: Record<string, string> = {
  SUBMITTED: "bg-blue-50 text-blue-700",
  REVIEWED: "bg-purple-50 text-purple-700",
  PASS: "bg-green-50 text-green-700",
  FAIL: "bg-red-50 text-red-700",
  RETURNED: "bg-amber-50 text-amber-700",
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function AdminSubmissions() {
  const { currentProgram } = useProgram();
  const [selectedWeekId, setSelectedWeekId] = useState<string>("all");
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");
  const [search, setSearch] = useState("");

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmission, setReviewSubmission] = useState<SubmissionWithUser | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>("PASS");
  const [reviewScore, setReviewScore] = useState<string>("");
  const [reviewFeedback, setReviewFeedback] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Fetch weeks
  const { data: weeks } = useApi<Week[]>(
    currentProgram ? `/programs/${currentProgram.id}/weeks` : null,
    [currentProgram?.id]
  );

  // Fetch missions (all or by week)
  const missionsUrl = currentProgram
    ? selectedWeekId === "all"
      ? `/programs/${currentProgram.id}/missions`
      : `/programs/${currentProgram.id}/missions/weeks/${selectedWeekId}`
    : null;

  const { data: missions } = useApi<Mission[]>(
    missionsUrl,
    [currentProgram?.id, selectedWeekId]
  );

  // Fetch submissions for selected mission
  const { data: submissionsData, loading: submissionsLoading, refetch: refetchSubmissions } =
    useApi<PaginatedResponse<SubmissionWithUser>>(
      currentProgram && selectedMissionId
        ? `/programs/${currentProgram.id}/missions/${selectedMissionId}/submissions?pageSize=200`
        : null,
      [currentProgram?.id, selectedMissionId]
    );

  const weeksList = weeks || [];
  const missionsList = missions || [];
  const submissions = submissionsData?.data || [];

  // Auto-select first mission when missions load
  const activeMissionId = selectedMissionId || missionsList[0]?.id || "";

  // Filter submissions by search
  const filtered = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase();
    return submissions.filter(
      (s) =>
        s.user.name.toLowerCase().includes(q) ||
        s.user.email.toLowerCase().includes(q)
    );
  }, [submissions, search]);

  const openReview = (sub: SubmissionWithUser) => {
    setReviewSubmission(sub);
    setReviewStatus(sub.status === "SUBMITTED" ? "PASS" : sub.status);
    setReviewScore(sub.score != null ? String(sub.score) : "");
    setReviewFeedback(sub.feedback || "");
    setReviewModalOpen(true);
  };

  const handleReview = async () => {
    if (!reviewSubmission || !currentProgram) return;
    setSaving(true);
    try {
      await apiPut(
        `/programs/${currentProgram.id}/submissions/${reviewSubmission.id}/review`,
        {
          status: reviewStatus,
          score: reviewScore ? Number(reviewScore) : undefined,
          feedback: reviewFeedback || undefined,
        }
      );
      toast.success("Review saved");
      setReviewModalOpen(false);
      refetchSubmissions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (sub: SubmissionWithUser, att: SubmissionAttachment) => {
    try {
      const res = await api.get(
        `/programs/${currentProgram!.id}/submissions/${sub.id}/attachments/${att.id}/download`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above to review submissions."
      />
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedWeekId} onValueChange={(v) => { setSelectedWeekId(v); setSelectedMissionId(""); }}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="All Weeks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Weeks</SelectItem>
            {weeksList.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                Week {w.weekNo} — {w.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={activeMissionId}
          onValueChange={setSelectedMissionId}
        >
          <SelectTrigger className="w-56 h-8 text-xs">
            <SelectValue placeholder="Select a test" />
          </SelectTrigger>
          <SelectContent>
            {missionsList.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <div className="flex items-center gap-2">
                  <span className="truncate">{m.title}</span>
                  {m.week && (
                    <span className="text-muted-foreground text-[10px]">W{m.week.weekNo}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search trainee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {submissions.length > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Submissions Table */}
      {!activeMissionId ? (
        <EmptyState
          icon={ClipboardList}
          title="Select a test"
          description="Choose a test from the dropdown to view submissions."
        />
      ) : submissionsLoading ? (
        <div className="text-sm text-muted-foreground text-center py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No submissions"
          description="No submissions found for this test."
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-[200px]">Trainee</TableHead>
                <TableHead className="text-xs w-[140px]">Submitted</TableHead>
                <TableHead className="text-xs w-[90px]">Status</TableHead>
                <TableHead className="text-xs w-[70px]">Score</TableHead>
                <TableHead className="text-xs w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => (
                <TableRow key={sub.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openReview(sub)}>
                  <TableCell>
                    <div>
                      <p className="text-xs" style={{ fontWeight: 500 }}>{sub.user.name}</p>
                      <p className="text-[11px] text-muted-foreground">{sub.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(sub.submittedAt), "yyyy-MM-dd HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] ${statusStyles[sub.status] || ""}`}>
                      {capitalize(sub.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {sub.score != null ? sub.score : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => { e.stopPropagation(); openReview(sub); }}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Review Modal */}
      <FloatingModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        className="sm:max-w-2xl"
      >
        {reviewSubmission && (
          <>
            <FloatingModalHeader>
              <FloatingModalTitle className="text-sm">
                Review Submission
              </FloatingModalTitle>
              <FloatingModalDescription className="text-xs">
                {reviewSubmission.user.name} ({reviewSubmission.user.email})
                {" · "}
                {format(new Date(reviewSubmission.submittedAt), "yyyy-MM-dd HH:mm")}
              </FloatingModalDescription>
            </FloatingModalHeader>

            <div className="space-y-4">
              {/* Submission Content */}
              <div className="space-y-2">
                <Label className="text-xs" style={{ fontWeight: 600 }}>Submission Content</Label>
                {reviewSubmission.contentText && (
                  <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {reviewSubmission.contentText}
                  </div>
                )}
                {reviewSubmission.contentUrl && (
                  <a
                    href={reviewSubmission.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    {reviewSubmission.contentUrl}
                  </a>
                )}
                {!reviewSubmission.contentText && !reviewSubmission.contentUrl && (
                  <p className="text-xs text-muted-foreground">No text or URL submitted.</p>
                )}
              </div>

              {/* Attachments */}
              {reviewSubmission.attachments && reviewSubmission.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs" style={{ fontWeight: 600 }}>
                    Attachments ({reviewSubmission.attachments.length})
                  </Label>
                  <div className="space-y-1">
                    {reviewSubmission.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/50 rounded-md text-xs"
                      >
                        <FileText className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1">{att.filename}</span>
                        <span className="text-muted-foreground shrink-0">
                          {formatFileSize(att.size)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={() => handleDownload(reviewSubmission, att)}
                        >
                          <Download className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="border-t" />

              {/* Review Form */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASS">Pass</SelectItem>
                      <SelectItem value="FAIL">Fail</SelectItem>
                      <SelectItem value="REVIEWED">Reviewed</SelectItem>
                      <SelectItem value="RETURNED">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Score (0-100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={reviewScore}
                    onChange={(e) => setReviewScore(e.target.value)}
                    placeholder="Optional"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Feedback</Label>
                <Textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Write feedback for the trainee..."
                  className="text-xs min-h-[80px]"
                />
              </div>
            </div>

            <FloatingModalFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReview}
                disabled={saving}
                className="text-xs"
              >
                {saving ? "Saving..." : "Save Review"}
              </Button>
            </FloatingModalFooter>
          </>
        )}
      </FloatingModal>
    </div>
  );
}
