import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
import { Download, Folder, CalendarX, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const rateBadge = (rate: number) => {
  if (rate >= 80) return "bg-green-50 text-green-700";
  if (rate >= 50) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
};

export function Reports() {
  const { currentProgram } = useProgram();
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");

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
  const rows = report?.data ?? [];
  const summary = report?.summary;

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
    if (rows.length === 0) {
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
      "Completion %",
      "Completed",
      "Total Tests",
      "Pending Reviews",
    ];
    const csvRows = rows.map((r) => [
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
            <p className="text-[11px] text-muted-foreground">Avg Completion</p>
            <p className="text-lg mt-1" style={{ fontWeight: 600 }}>
              {summary.avgCompletionRate}%
            </p>
          </div>
          <div className="border rounded-md p-3">
            <p className="text-[11px] text-muted-foreground">Pending Reviews</p>
            <p className="text-lg mt-1" style={{ fontWeight: 600 }}>
              {summary.totalPendingReviews}
            </p>
          </div>
        </div>
      )}

      {/* Filters + Export */}
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
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
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
      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No trainees found"
          description={
            selectedTeam !== "all"
              ? "No trainees found for this team filter."
              : "No trainees have been enrolled in this program yet."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-xs">Name</TableHead>
              <TableHead className="h-8 text-xs">Team</TableHead>
              <TableHead className="h-8 text-xs w-48">Attendance</TableHead>
              <TableHead className="h-8 text-xs w-48">Completion</TableHead>
              <TableHead className="h-8 text-xs text-center w-20">Pending</TableHead>
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
      )}
    </div>
  );
}
