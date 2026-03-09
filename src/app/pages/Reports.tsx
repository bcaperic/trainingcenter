import { useState, useMemo } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
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
import type { Week, Team, WeeklyReportResponse } from "../types/api";
import { Download, Folder, CalendarX, Users, Search, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 15;

const rateBadge = (rate: number) => {
  if (rate >= 80) return "bg-green-50 text-green-700";
  if (rate >= 50) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
};

export function Reports() {
  const { currentProgram } = useProgram();
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: weeks } = useApi<Week[]>(
    currentProgram ? `/programs/${currentProgram.id}/weeks` : null,
    [currentProgram?.id]
  );

  const { data: teams } = useApi<Team[]>(
    currentProgram ? `/programs/${currentProgram.id}/teams` : null,
    [currentProgram?.id]
  );

  const weekParam = selectedWeek !== "all" ? `weekId=${selectedWeek}` : "";
  const teamParam = selectedTeam !== "all" ? `teamId=${selectedTeam}` : "";
  const queryParams = [weekParam, teamParam].filter(Boolean).join("&");
  const reportUrl = currentProgram
    ? `/programs/${currentProgram.id}/reports/weekly${queryParams ? `?${queryParams}` : ""}`
    : null;

  const { data: report, loading, error } = useApi<WeeklyReportResponse>(
    reportUrl,
    [currentProgram?.id, selectedWeek, selectedTeam]
  );

  const weeksList = weeks ?? [];
  const teamsList = teams ?? [];
  const allRows = report?.data ?? [];
  const summary = report?.summary;

  // Search filter
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return allRows;
    const q = searchQuery.toLowerCase();
    return allRows.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        (r.teamName && r.teamName.toLowerCase().includes(q))
    );
  }, [allRows, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!currentProgram) {
    return (
      <EmptyState
        icon={Folder}
        title="No program selected"
        description="Select a program from the switcher above to view reports."
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

  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Name",
      "Email",
      "Team",
      "Attendance %",
      "Attended",
      "Total Sessions",
      "Test Pass Rate %",
      "Passed Tests",
      "Total Tests",
      "Awaiting Review",
    ];
    const csvRows = filteredRows.map((r) => [
      r.userName,
      r.userEmail,
      r.teamName || "-",
      r.attendanceRate,
      r.attendedSessions,
      r.totalSessions,
      r.completionRate,
      r.completedMissions,
      r.totalMissions,
      r.pendingCount,
    ]);
    const bom = "\uFEFF";
    const csv = [headers, ...csvRows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${currentProgram.shortName}-${selectedWeek === "all" ? "all" : selectedWeek}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="border rounded-md p-3">
            <p className="text-[11px] text-muted-foreground">Trainees</p>
            <p className="text-lg mt-1" style={{ fontWeight: 600 }}>
              {summary.traineeCount}
            </p>
          </div>
          <div className="border rounded-md p-3">
            <p className="text-[11px] text-muted-foreground">Avg Attendance</p>
            <p className="text-lg mt-1" style={{ fontWeight: 600 }}>
              {summary.avgAttendanceRate}%
            </p>
          </div>
          <div className="border rounded-md p-3">
            <p className="text-[11px] text-muted-foreground">Avg Test Pass Rate</p>
            <p className="text-lg mt-1" style={{ fontWeight: 600 }}>
              {summary.avgCompletionRate}%
            </p>
          </div>
          <div className="border rounded-md p-3">
            <p className="text-[11px] text-muted-foreground">Awaiting Review</p>
            <p className="text-lg mt-1" style={{ fontWeight: 600 }}>
              {summary.totalPendingReviews}
            </p>
          </div>
        </div>
      )}

      {/* Filters + Search + Export */}
      <div className="flex items-center gap-2">
        <Select value={selectedWeek} onValueChange={(v) => { setSelectedWeek(v); setPage(1); }}>
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
        <Select value={selectedTeam} onValueChange={(v) => { setSelectedTeam(v); setPage(1); }}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="All Teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teamsList.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search trainee..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="h-8 w-44 pl-7 text-xs"
          />
        </div>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={handleExportCSV}
        >
          <Download className="size-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Trainee Report Table */}
      {filteredRows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No trainees found"
          description={
            searchQuery
              ? "No trainees match your search."
              : selectedTeam !== "all"
                ? "No trainees found for this team filter."
                : "No trainees have been enrolled in this program yet."
          }
        />
      ) : (
        <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-xs">Name</TableHead>
              <TableHead className="h-8 text-xs">Team</TableHead>
              <TableHead className="h-8 text-xs w-48">
                <div className="flex items-center gap-1">
                  Attendance
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="size-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-52">
                      (Present + Late) / Total Sessions × 100
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-8 text-xs w-48">
                <div className="flex items-center gap-1">
                  Test Pass Rate
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="size-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-52">
                      (Pass + Reviewed) / Total Tests × 100
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-8 text-xs text-center w-28">
                <div className="flex items-center justify-center gap-1">
                  Awaiting Review
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="size-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-52">
                      Submissions with status "Submitted" pending instructor review
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.userId} className="h-10">
                <TableCell className="py-1.5">
                  <p className="text-xs" style={{ fontWeight: 500 }}>
                    {row.userName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{row.userEmail}</p>
                </TableCell>
                <TableCell className="py-1.5 text-xs text-muted-foreground">
                  {row.teamName || "-"}
                </TableCell>
                <TableCell className="py-1.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] w-12 justify-center ${rateBadge(row.attendanceRate)}`}
                    >
                      {row.attendanceRate}%
                    </Badge>
                    <Progress value={row.attendanceRate} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {row.attendedSessions}/{row.totalSessions}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] w-12 justify-center ${rateBadge(row.completionRate)}`}
                    >
                      {row.completionRate}%
                    </Badge>
                    <Progress value={row.completionRate} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {row.completedMissions}/{row.totalMissions}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-1.5 text-center">
                  {row.pendingCount > 0 ? (
                    <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700">
                      {row.pendingCount}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">0</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TooltipProvider>
      )}

      {/* Pagination */}
      {filteredRows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
