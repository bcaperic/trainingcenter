// ─── Auth ───
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: string;
}

export interface Membership {
  id: string;
  programId: string;
  role: "ADMIN" | "INSTRUCTOR" | "TRAINEE";
  teamId: string | null;
  status: string;
  program: {
    id: string;
    name: string;
    shortName: string;
    status: string;
  };
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  status: string;
  memberships: Membership[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── Program ───
export interface Program {
  id: string;
  name: string;
  shortName: string;
  description: string;
  duration: string;
  startDate: string | null;
  endDate: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  memberCount?: number;
  createdAt: string;
}

// ─── Program Attachment ───
export interface ProgramAttachment {
  id: string;
  programId: string;
  filename: string;
  mimeType: string;
  size: number;
  key: string;
  uploadedAt: string;
  uploadedBy: string;
}

// ─── Paginated Response ───
export interface PaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

// ─── Week ───
export interface Week {
  id: string;
  programId: string;
  weekNo: number;
  title: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
}

// ─── Session ───
export interface Session {
  id: string;
  programId: string;
  weekId: string | null;
  type: "LIVE" | "MAKEUP" | "DRILL" | "EVAL" | "WAR_ROOM";
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  capacity: number | null;
  locationOrUrl: string | null;
  recordingUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "ENDED" | "CANCELED";
  checkinMode: "CODE" | "BUTTON";
  enrolledCount?: number;
}

// ─── Mission ───
export interface Mission {
  id: string;
  programId: string;
  weekId: string;
  type: "REPORT" | "CODE" | "TEST" | "DRILL_RESULT";
  title: string;
  description: string;
  dueAt: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  submissionCount?: number;
  userStatus?: "pending" | "submitted" | "reviewed" | "overdue";
  userSubmission?: Submission;
}

// ─── Submission ───
export interface SubmissionAttachment {
  id: string;
  submissionId: string;
  filename: string;
  mimeType: string;
  size: number;
  key: string;
  uploadedAt: string;
}

export interface Submission {
  id: string;
  missionId: string;
  userId: string;
  contentText: string | null;
  contentUrl: string | null;
  submittedAt: string;
  status: "SUBMITTED" | "REVIEWED" | "PASS" | "FAIL" | "RETURNED";
  score: number | null;
  feedback: string | null;
  reviewedAt: string | null;
  attachments?: SubmissionAttachment[];
}

// ─── Team ───
export interface Team {
  id: string;
  programId: string;
  name: string;
  leadUserId: string | null;
  lead?: { id: string; name: string; email: string } | null;
  memberCount?: number;
}

// ─── ProgramMember ───
export interface ProgramMember {
  id: string;
  programId: string;
  userId: string;
  role: "ADMIN" | "INSTRUCTOR" | "TRAINEE";
  teamId: string | null;
  status: string;
  user: { id: string; email: string; name: string; status: string };
  team: { id: string; name: string } | null;
}

// ─── Enrollment ───
export interface Enrollment {
  id: string;
  sessionId: string;
  userId: string;
  status: "APPLIED" | "WAITLISTED" | "CANCELED";
  session?: Session;
}

// ─── Attendance ───
export interface Attendance {
  id: string;
  sessionId: string;
  userId: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
  checkedInAt: string | null;
  method: string | null;
  session?: Session;
}

// ─── Attendance Detail ───
export interface AttendanceDetailTrainee {
  userId: string;
  userName: string;
  userEmail: string;
  teamName: string | null;
  attendanceStatus: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" | null;
  checkedInAt: string | null;
  completedMissions: number;
  totalMissions: number;
}

export interface AttendanceDetailResponse {
  session: Session;
  summary: {
    totalTrainees: number;
    checkedIn: number;
    notCheckedIn: number;
    totalMissions: number;
  };
  trainees: AttendanceDetailTrainee[];
}

// ─── Ops Summary ───
export interface OpsSummaryTrainee {
  userId: string;
  userName: string;
  userEmail: string;
  teamName: string | null;
  attendanceStatus: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" | null;
  checkedInAt: string | null;
  completedMissions: number;
  totalMissions: number;
  testSubmissionStatus: string | null;
  submittedAt: string | null;
}

export interface OpsSummaryResponse {
  session: Session;
  summary: {
    totalTrainees: number;
    checkedIn: number;
    lateCount: number;
    notCheckedIn: number;
    totalMissions: number;
  };
  trainees: OpsSummaryTrainee[];
}

// ─── Announcement ───
export interface Announcement {
  id: string;
  programId: string;
  title: string;
  body: string;
  isPinned: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
}

// ─── Notification ───
export interface Notification {
  id: string;
  programId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  linkPath: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Dashboard ───
export interface AdminDashboardData {
  traineeCount: number;
  avgAttendanceRate: number;
  avgCompletionRate: number;
  pendingReviews: number;
  todaySessions: Session[];
}

export interface LearnerDashboardData {
  attendanceRate: number;
  completionRate: number;
  points: number;
  gateStatus: string | null;
  upcomingSessions: Session[];
}

// ─── Activity Feed ───
export interface ActivityItem {
  id: string;
  type: "checkin" | "submission" | "session";
  text: string;
  createdAt: string;
}

// ─── Report ───
export interface TraineeReportRow {
  userId: string;
  userName: string;
  userEmail: string;
  teamName: string | null;
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
  pendingCount: number;
}

export interface ReportSummary {
  traineeCount: number;
  avgAttendanceRate: number;
  avgCompletionRate: number;
  totalPendingReviews: number;
  totalSessions: number;
  totalMissions: number;
}

export interface WeeklyReportResponse {
  data: TraineeReportRow[];
  summary: ReportSummary;
}

// ─── Recording ───
export interface RecordingWeek {
  weekId: string | null;
  week: { id: string; weekNo: number; title: string } | null;
  sessions: Session[];
}
