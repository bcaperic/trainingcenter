// Pathways Learning Platform — Mock Data (Multi-program)

export interface Program {
  id: string;
  name: string;
  shortName: string;
  description: string;
  duration: string;
  status: "active" | "upcoming" | "completed";
}

export const programs: Program[] = [
  {
    id: "bcvn-ksp",
    name: "Developer Foundations",
    shortName: "DEV FDN",
    description: "Code-level troubleshooting and independent operations capability building",
    duration: "24 weeks",
    status: "active",
  },
  {
    id: "bcvn-adv",
    name: "Advanced Operations",
    shortName: "ADV OPS",
    description: "Advanced operations and incident response program",
    duration: "12 weeks",
    status: "active",
  },
  {
    id: "bcid-dev",
    name: "New Developer Onboarding",
    shortName: "NEW DEV",
    description: "New developer onboarding and training program",
    duration: "8 weeks",
    status: "upcoming",
  },
];

export interface Week {
  value: string;
  label: string;
  programId: string;
}

export const weeks: Week[] = [
  // BCVN KSP
  { value: "ksp-w1", label: "Week 1 (Phase 1)", programId: "bcvn-ksp" },
  { value: "ksp-w2", label: "Week 2 (Phase 1)", programId: "bcvn-ksp" },
  { value: "ksp-w3", label: "Week 3 (Phase 1)", programId: "bcvn-ksp" },
  { value: "ksp-w4", label: "Week 4 (Phase 2)", programId: "bcvn-ksp" },
  { value: "ksp-w5", label: "Week 5 (Phase 2)", programId: "bcvn-ksp" },
  { value: "ksp-w6", label: "Week 6 (Phase 2)", programId: "bcvn-ksp" },
  { value: "ksp-w7", label: "Week 7 (Phase 2)", programId: "bcvn-ksp" },
  { value: "ksp-w8", label: "Week 8 (Phase 2)", programId: "bcvn-ksp" },
  // BCVN ADV
  { value: "adv-w1", label: "Week 1 (Monitoring)", programId: "bcvn-adv" },
  { value: "adv-w2", label: "Week 2 (Monitoring)", programId: "bcvn-adv" },
  { value: "adv-w3", label: "Week 3 (Incident)", programId: "bcvn-adv" },
  { value: "adv-w4", label: "Week 4 (Incident)", programId: "bcvn-adv" },
  // BCID DEV — no weeks yet (upcoming program)
];

export const teams = [
  { value: "all", label: "All Teams" },
  { value: "auth", label: "Auth Team" },
  { value: "cns", label: "CnS Team" },
  { value: "merchant", label: "Merchant/WDS/TMS Team" },
];

export type SessionType = "online" | "offline" | "recording";

export interface Session {
  id: string;
  programId: string;
  weekId: string;
  date: string;
  time: string;
  type: SessionType;
  title: string;
  instructor: string;
  capacity: string;
  enrolled: boolean;
  recordingUrl?: string;
  description: string;
  module: string;
}

export const sessions: Session[] = [
  // BCVN KSP sessions
  {
    id: "s1",
    programId: "bcvn-ksp",
    weekId: "ksp-w1",
    date: "2026-03-03",
    time: "10:00-12:00",
    type: "online",
    title: "BAIS Framework Architecture Overview",
    instructor: "Felix",
    capacity: "8/10",
    enrolled: true,
    description: "BAIS 프레임워크의 계층 구조(Handler, Adapter, Service) 및 데이터 흐름 파악.",
    module: "Phase 1 - Foundation",
  },
  {
    id: "s2",
    programId: "bcvn-ksp",
    weekId: "ksp-w1",
    date: "2026-03-03",
    time: "14:00-16:00",
    type: "offline",
    title: "ISO8583 Message Parsing Workshop",
    instructor: "Felix",
    capacity: "5/5",
    enrolled: false,
    description: "ISO8583 브랜드사 전문과 내부 표준 전문 간의 매핑 테이블 및 파싱 로직 실습.",
    module: "Phase 1 - Foundation",
  },
  {
    id: "s3",
    programId: "bcvn-ksp",
    weekId: "ksp-w2",
    date: "2026-03-04",
    time: "10:00-11:30",
    type: "online",
    title: "HSM Interface & PIN Block Processing",
    instructor: "Felix",
    capacity: "7/10",
    enrolled: false,
    description: "HSM 인터페이스 기반의 PIN Block 처리 및 Key 교환 프로세스 학습.",
    module: "Phase 1 - Foundation",
  },
  {
    id: "s4",
    programId: "bcvn-ksp",
    weekId: "ksp-w2",
    date: "2026-03-05",
    time: "09:00-11:00",
    type: "online",
    title: "Authorization Logic Deep Dive",
    instructor: "Felix",
    capacity: "6/10",
    enrolled: true,
    description: "유효성 검사 로직, 거래 라우팅, 망 취소(Reversal) 처리 흐름 분석.",
    module: "Phase 2 - Core Modules",
  },
  {
    id: "s5",
    programId: "bcvn-ksp",
    weekId: "ksp-w3",
    date: "2026-03-06",
    time: "14:00-16:00",
    type: "recording",
    title: "Merchant Lifecycle Management",
    instructor: "Yosua",
    capacity: "-",
    enrolled: false,
    recordingUrl: "https://example.com/recording/s5",
    description: "가맹점 라이프사이클(신규~해지) 및 수수료(MDR) 적용 우선순위 계산 로직.",
    module: "Phase 2 - Core Modules",
  },
  {
    id: "s6",
    programId: "bcvn-ksp",
    weekId: "ksp-w3",
    date: "2026-03-07",
    time: "10:00-12:00",
    type: "online",
    title: "Clearing & Settlement Process",
    instructor: "Andar",
    capacity: "4/10",
    enrolled: false,
    description: "Incoming/Outgoing 파일 파싱 프로그램 분석 및 정산 불일치 시 대사(Recon) 프로세스.",
    module: "Phase 2 - Core Modules",
  },
  // BCVN ADV sessions
  {
    id: "s7",
    programId: "bcvn-adv",
    weekId: "adv-w1",
    date: "2026-03-10",
    time: "10:00-12:00",
    type: "online",
    title: "Production Monitoring Setup",
    instructor: "Felix",
    capacity: "6/8",
    enrolled: true,
    description: "운영 환경 모니터링 시스템 구성 및 알림 설정 실습.",
    module: "Monitoring",
  },
  {
    id: "s8",
    programId: "bcvn-adv",
    weekId: "adv-w1",
    date: "2026-03-11",
    time: "14:00-16:00",
    type: "offline",
    title: "Log Analysis & APM Tools",
    instructor: "Andar",
    capacity: "5/8",
    enrolled: false,
    description: "ELK 스택 기반 로그 분석 및 APM 도구 활용법.",
    module: "Monitoring",
  },
  {
    id: "s9",
    programId: "bcvn-adv",
    weekId: "adv-w3",
    date: "2026-03-17",
    time: "09:00-12:00",
    type: "offline",
    title: "Incident Response Drill",
    instructor: "Riko",
    capacity: "8/8",
    enrolled: false,
    description: "장애 상황 시뮬레이션 및 대응 훈련 (MTTR 30분 목표).",
    module: "Incident Response",
  },
  // BCID DEV — no sessions yet
];

export interface Mission {
  id: string;
  programId: string;
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "submitted" | "reviewed" | "overdue";
  week: string;
  submissions: { date: string; type: string; content: string; score?: number }[];
}

export const missions: Mission[] = [
  // BCVN KSP missions
  {
    id: "m1",
    programId: "bcvn-ksp",
    title: "BAIS Architecture Diagram",
    description: "BAIS 프레임워크의 계층 구조를 분석하고, Handler → Adapter → Service 흐름을 다이어그램으로 작성하세요.",
    dueDate: "2026-03-07",
    status: "submitted",
    week: "ksp-w1",
    submissions: [
      { date: "2026-03-05", type: "link", content: "https://docs.google.com/drawings/d/example1", score: 85 },
    ],
  },
  {
    id: "m2",
    programId: "bcvn-ksp",
    title: "ISO8583 Field Mapping Table",
    description: "브랜드사 전문(Visa/Master)과 내부 표준 전문 간의 매핑 테이블을 작성하세요.",
    dueDate: "2026-03-07",
    status: "pending",
    week: "ksp-w1",
    submissions: [],
  },
  {
    id: "m3",
    programId: "bcvn-ksp",
    title: "PIN Block Encryption Flow Analysis",
    description: "HSM을 이용한 PIN Block 암호화/복호화 흐름을 분석하고 시퀀스 다이어그램을 제출하세요.",
    dueDate: "2026-03-10",
    status: "pending",
    week: "ksp-w2",
    submissions: [],
  },
  {
    id: "m4",
    programId: "bcvn-ksp",
    title: "Authorization Reversal Test Case",
    description: "망 취소(Reversal) 시나리오 5개를 정의하고, 각 시나리오별 테스트 케이스를 작성하세요.",
    dueDate: "2026-03-14",
    status: "overdue",
    week: "ksp-w2",
    submissions: [],
  },
  {
    id: "m5",
    programId: "bcvn-ksp",
    title: "MDR Calculation Logic Review",
    description: "가맹점 수수료(MDR) 적용 우선순위 계산 로직을 코드 리뷰하고 개선점을 제안하세요.",
    dueDate: "2026-03-21",
    status: "reviewed",
    week: "ksp-w3",
    submissions: [
      { date: "2026-03-18", type: "text", content: "MDR 계산 로직 분석 완료. 우선순위: BIN > MCC > Default. 개선점: 캐시 적용 권장.", score: 92 },
    ],
  },
  // BCVN ADV missions
  {
    id: "m6",
    programId: "bcvn-adv",
    title: "Monitoring Dashboard Setup",
    description: "Grafana 기반 운영 대시보드를 구성하고 주요 메트릭 5개를 설정하세요.",
    dueDate: "2026-03-14",
    status: "pending",
    week: "adv-w1",
    submissions: [],
  },
  {
    id: "m7",
    programId: "bcvn-adv",
    title: "Incident Runbook Draft",
    description: "주요 장애 유형 3가지에 대한 대응 런북을 작성하세요.",
    dueDate: "2026-03-21",
    status: "pending",
    week: "adv-w3",
    submissions: [],
  },
  // BCID DEV — no missions yet
];

export interface Trainee {
  id: string;
  programId: string;
  name: string;
  team: string;
  attendanceRate: number;
  completionRate: number;
  points: number;
  gateStatus: "passed" | "pending" | "failed";
}

export const trainees: Trainee[] = [
  // BCVN KSP
  { id: "t1", programId: "bcvn-ksp", name: "Nguyen Van A", team: "auth", attendanceRate: 95, completionRate: 88, points: 420, gateStatus: "passed" },
  { id: "t2", programId: "bcvn-ksp", name: "Tran Thi B", team: "cns", attendanceRate: 100, completionRate: 92, points: 480, gateStatus: "passed" },
  { id: "t3", programId: "bcvn-ksp", name: "Le Van C", team: "cns", attendanceRate: 80, completionRate: 65, points: 310, gateStatus: "pending" },
  { id: "t4", programId: "bcvn-ksp", name: "Pham Duc D", team: "merchant", attendanceRate: 90, completionRate: 78, points: 380, gateStatus: "passed" },
  { id: "t5", programId: "bcvn-ksp", name: "Hoang Van E", team: "merchant", attendanceRate: 70, completionRate: 45, points: 180, gateStatus: "failed" },
  { id: "t6", programId: "bcvn-ksp", name: "Do Thi F", team: "auth", attendanceRate: 85, completionRate: 72, points: 350, gateStatus: "pending" },
  { id: "t7", programId: "bcvn-ksp", name: "Vo Van G", team: "cns", attendanceRate: 92, completionRate: 85, points: 410, gateStatus: "passed" },
  // BCVN ADV
  { id: "t8", programId: "bcvn-adv", name: "Nguyen Van A", team: "auth", attendanceRate: 100, completionRate: 50, points: 120, gateStatus: "pending" },
  { id: "t9", programId: "bcvn-adv", name: "Tran Thi B", team: "cns", attendanceRate: 90, completionRate: 60, points: 150, gateStatus: "pending" },
  { id: "t10", programId: "bcvn-adv", name: "Pham Duc D", team: "merchant", attendanceRate: 80, completionRate: 40, points: 90, gateStatus: "pending" },
  // BCID DEV — no trainees yet
];

export interface AttendanceRecord {
  id: string;
  programId: string;
  sessionTitle: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
}

export const attendanceRecords: AttendanceRecord[] = [
  // BCVN KSP
  { id: "a1", programId: "bcvn-ksp", sessionTitle: "BAIS Framework Architecture Overview", date: "2026-03-03", status: "present" },
  { id: "a2", programId: "bcvn-ksp", sessionTitle: "ISO8583 Message Parsing Workshop", date: "2026-03-03", status: "present" },
  { id: "a3", programId: "bcvn-ksp", sessionTitle: "HSM Interface & PIN Block Processing", date: "2026-03-04", status: "late" },
  { id: "a4", programId: "bcvn-ksp", sessionTitle: "Authorization Logic Deep Dive", date: "2026-03-05", status: "present" },
  { id: "a5", programId: "bcvn-ksp", sessionTitle: "Merchant Lifecycle Management", date: "2026-03-06", status: "absent" },
  { id: "a6", programId: "bcvn-ksp", sessionTitle: "Clearing & Settlement Process", date: "2026-03-07", status: "excused" },
  // BCVN ADV
  { id: "a7", programId: "bcvn-adv", sessionTitle: "Production Monitoring Setup", date: "2026-03-10", status: "present" },
  { id: "a8", programId: "bcvn-adv", sessionTitle: "Log Analysis & APM Tools", date: "2026-03-11", status: "present" },
  // BCID DEV — none
];

// Helper: compute dashboard stats per program
export function getDashboardStats(programId: string) {
  const programTrainees = trainees.filter((t) => t.programId === programId);
  if (programTrainees.length === 0) {
    return { attendanceRate: 0, completionRate: 0, totalPoints: 0 };
  }
  const attendanceRate = Math.round(
    programTrainees.reduce((s, t) => s + t.attendanceRate, 0) / programTrainees.length
  );
  const completionRate = Math.round(
    programTrainees.reduce((s, t) => s + t.completionRate, 0) / programTrainees.length
  );
  const totalPoints = Math.round(
    programTrainees.reduce((s, t) => s + t.points, 0) / programTrainees.length
  );
  return { attendanceRate, completionRate, totalPoints };
}

export function getUpcomingDeadlines(programId: string) {
  const now = new Date("2026-03-03");
  return missions
    .filter((m) => m.programId === programId && (m.status === "pending" || m.status === "overdue"))
    .map((m) => {
      const due = new Date(m.dueDate);
      const daysLeft = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return { title: m.title, dueDate: m.dueDate, daysLeft };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);
}

// ─── Admin CMS Data ────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "instructor" | "trainee";
  team: string;
  status: "active" | "inactive";
  programIds: string[];
}

export const adminUsers: AdminUser[] = [
  { id: "u1", name: "Admin Park", email: "admin.park@company.com", role: "admin", team: "-", status: "active", programIds: ["bcvn-ksp", "bcvn-adv", "bcid-dev"] },
  { id: "u2", name: "Felix", email: "felix@company.com", role: "instructor", team: "auth", status: "active", programIds: ["bcvn-ksp", "bcvn-adv"] },
  { id: "u3", name: "Andar", email: "andar@company.com", role: "instructor", team: "cns", status: "active", programIds: ["bcvn-ksp", "bcvn-adv"] },
  { id: "u4", name: "Riko", email: "riko@company.com", role: "instructor", team: "cns", status: "active", programIds: ["bcvn-adv"] },
  { id: "u5", name: "Yosua", email: "yosua@company.com", role: "instructor", team: "merchant", status: "active", programIds: ["bcvn-ksp"] },
  { id: "u6", name: "Nguyen Van A", email: "nguyen.a@company.com", role: "trainee", team: "auth", status: "active", programIds: ["bcvn-ksp", "bcvn-adv"] },
  { id: "u7", name: "Tran Thi B", email: "tran.b@company.com", role: "trainee", team: "cns", status: "active", programIds: ["bcvn-ksp", "bcvn-adv"] },
  { id: "u8", name: "Le Van C", email: "le.c@company.com", role: "trainee", team: "cns", status: "active", programIds: ["bcvn-ksp"] },
  { id: "u9", name: "Pham Duc D", email: "pham.d@company.com", role: "trainee", team: "merchant", status: "active", programIds: ["bcvn-ksp", "bcvn-adv"] },
  { id: "u10", name: "Hoang Van E", email: "hoang.e@company.com", role: "trainee", team: "merchant", status: "inactive", programIds: ["bcvn-ksp"] },
  { id: "u11", name: "Do Thi F", email: "do.f@company.com", role: "trainee", team: "auth", status: "active", programIds: ["bcvn-ksp"] },
  { id: "u12", name: "Vo Van G", email: "vo.g@company.com", role: "trainee", team: "cns", status: "active", programIds: ["bcvn-ksp"] },
];

export interface AdminTeam {
  id: string;
  name: string;
  memberCount: number;
  lead: string;
}

export const adminTeams: AdminTeam[] = [
  { id: "at1", name: "Auth Team", memberCount: 3, lead: "Felix" },
  { id: "at2", name: "CnS Team", memberCount: 4, lead: "Andar" },
  { id: "at3", name: "Merchant/WDS/TMS Team", memberCount: 3, lead: "Yosua" },
];

export interface CurriculumWeek {
  id: string;
  programId: string;
  weekNo: number;
  title: string;
  period: string;
  status: "published" | "draft";
}

export const curriculumWeeks: CurriculumWeek[] = [
  { id: "cw1", programId: "bcvn-ksp", weekNo: 1, title: "Framework & Message Parsing", period: "2026-03-02 ~ 03-06", status: "published" },
  { id: "cw2", programId: "bcvn-ksp", weekNo: 2, title: "Security & Authorization", period: "2026-03-09 ~ 03-13", status: "published" },
  { id: "cw3", programId: "bcvn-ksp", weekNo: 3, title: "Merchant & Settlement", period: "2026-03-16 ~ 03-20", status: "published" },
  { id: "cw4", programId: "bcvn-ksp", weekNo: 4, title: "Error Handling & Testing", period: "2026-03-23 ~ 03-27", status: "draft" },
  { id: "cw5", programId: "bcvn-ksp", weekNo: 5, title: "Performance Tuning", period: "2026-03-30 ~ 04-03", status: "draft" },
  { id: "cw6", programId: "bcvn-adv", weekNo: 1, title: "Monitoring Foundations", period: "2026-03-09 ~ 03-13", status: "published" },
  { id: "cw7", programId: "bcvn-adv", weekNo: 2, title: "Log & APM Analysis", period: "2026-03-16 ~ 03-20", status: "published" },
  { id: "cw8", programId: "bcvn-adv", weekNo: 3, title: "Incident Response", period: "2026-03-23 ~ 03-27", status: "draft" },
];

export interface CurriculumMission {
  id: string;
  programId: string;
  weekId: string;
  weekLabel: string;
  title: string;
  dueDate: string;
  type: "assignment" | "quiz" | "project";
  status: "published" | "draft";
}

export const curriculumMissions: CurriculumMission[] = [
  { id: "cm1", programId: "bcvn-ksp", weekId: "cw1", weekLabel: "W1", title: "BAIS Architecture Diagram", dueDate: "2026-03-07", type: "assignment", status: "published" },
  { id: "cm2", programId: "bcvn-ksp", weekId: "cw1", weekLabel: "W1", title: "ISO8583 Field Mapping Table", dueDate: "2026-03-07", type: "assignment", status: "published" },
  { id: "cm3", programId: "bcvn-ksp", weekId: "cw2", weekLabel: "W2", title: "PIN Block Encryption Flow Analysis", dueDate: "2026-03-10", type: "assignment", status: "published" },
  { id: "cm4", programId: "bcvn-ksp", weekId: "cw2", weekLabel: "W2", title: "Authorization Reversal Test Case", dueDate: "2026-03-14", type: "project", status: "published" },
  { id: "cm5", programId: "bcvn-ksp", weekId: "cw3", weekLabel: "W3", title: "MDR Calculation Logic Review", dueDate: "2026-03-21", type: "project", status: "published" },
  { id: "cm6", programId: "bcvn-ksp", weekId: "cw4", weekLabel: "W4", title: "Exception Handling Audit", dueDate: "2026-03-28", type: "assignment", status: "draft" },
  { id: "cm7", programId: "bcvn-ksp", weekId: "cw4", weekLabel: "W4", title: "Week 4 Knowledge Quiz", dueDate: "2026-03-28", type: "quiz", status: "draft" },
  { id: "cm8", programId: "bcvn-adv", weekId: "cw6", weekLabel: "W1", title: "Monitoring Dashboard Setup", dueDate: "2026-03-14", type: "project", status: "published" },
  { id: "cm9", programId: "bcvn-adv", weekId: "cw8", weekLabel: "W3", title: "Incident Runbook Draft", dueDate: "2026-03-21", type: "assignment", status: "draft" },
];

export interface AdminSession {
  id: string;
  programId: string;
  weekId: string;
  date: string;
  time: string;
  type: SessionType;
  title: string;
  instructor: string;
  maxCapacity: number;
  enrolled: number;
  status: "scheduled" | "completed" | "cancelled";
  meetingUrl?: string;
  recordingUrl?: string;
}

export const adminSessions: AdminSession[] = [
  { id: "as1", programId: "bcvn-ksp", weekId: "cw1", date: "2026-03-03", time: "10:00-12:00", type: "online", title: "BAIS Framework Architecture Overview", instructor: "Felix", maxCapacity: 10, enrolled: 8, status: "scheduled", meetingUrl: "https://meet.google.com/abc" },
  { id: "as2", programId: "bcvn-ksp", weekId: "cw1", date: "2026-03-03", time: "14:00-16:00", type: "offline", title: "ISO8583 Message Parsing Workshop", instructor: "Felix", maxCapacity: 5, enrolled: 5, status: "scheduled" },
  { id: "as3", programId: "bcvn-ksp", weekId: "cw2", date: "2026-03-04", time: "10:00-11:30", type: "online", title: "HSM Interface & PIN Block Processing", instructor: "Felix", maxCapacity: 10, enrolled: 7, status: "scheduled", meetingUrl: "https://meet.google.com/def" },
  { id: "as4", programId: "bcvn-ksp", weekId: "cw2", date: "2026-03-05", time: "09:00-11:00", type: "online", title: "Authorization Logic Deep Dive", instructor: "Felix", maxCapacity: 10, enrolled: 6, status: "scheduled", meetingUrl: "https://meet.google.com/ghi" },
  { id: "as5", programId: "bcvn-ksp", weekId: "cw3", date: "2026-03-06", time: "14:00-16:00", type: "recording", title: "Merchant Lifecycle Management", instructor: "Yosua", maxCapacity: 0, enrolled: 0, status: "completed", recordingUrl: "https://example.com/recording/s5" },
  { id: "as6", programId: "bcvn-ksp", weekId: "cw3", date: "2026-03-07", time: "10:00-12:00", type: "online", title: "Clearing & Settlement Process", instructor: "Andar", maxCapacity: 10, enrolled: 4, status: "cancelled" },
  { id: "as7", programId: "bcvn-adv", weekId: "cw6", date: "2026-03-10", time: "10:00-12:00", type: "online", title: "Production Monitoring Setup", instructor: "Felix", maxCapacity: 8, enrolled: 6, status: "scheduled", meetingUrl: "https://meet.google.com/jkl" },
  { id: "as8", programId: "bcvn-adv", weekId: "cw6", date: "2026-03-11", time: "14:00-16:00", type: "offline", title: "Log Analysis & APM Tools", instructor: "Andar", maxCapacity: 8, enrolled: 5, status: "scheduled" },
  { id: "as9", programId: "bcvn-adv", weekId: "cw8", date: "2026-03-17", time: "09:00-12:00", type: "offline", title: "Incident Response Drill", instructor: "Riko", maxCapacity: 8, enrolled: 8, status: "scheduled" },
];

// ─── Notifications ─────────────────────────────────────────

export type NotificationType = "session_reminder" | "mission_due" | "report_generated" | "recording_available";

export interface Notification {
  id: string;
  programId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  linkTo: string; // deep-link path
  relatedId?: string; // session/mission/report id
}

export const notifications: Notification[] = [
  // BCVN KSP
  {
    id: "n1",
    programId: "bcvn-ksp",
    type: "session_reminder",
    title: "Session in 30 minutes",
    body: "BAIS Framework Architecture Overview starts at 10:00.",
    read: false,
    createdAt: "2026-03-03T09:30:00",
    linkTo: "/learn/schedule",
    relatedId: "s1",
  },
  {
    id: "n2",
    programId: "bcvn-ksp",
    type: "mission_due",
    title: "Mission due tomorrow",
    body: "ISO8583 Field Mapping Table is due on 2026-03-07.",
    read: false,
    createdAt: "2026-03-03T08:00:00",
    linkTo: "/learn/missions",
    relatedId: "m2",
  },
  {
    id: "n3",
    programId: "bcvn-ksp",
    type: "recording_available",
    title: "Recording available",
    body: "Merchant Lifecycle Management recording has been uploaded.",
    read: true,
    createdAt: "2026-03-02T16:00:00",
    linkTo: "/learn/videos",
    relatedId: "s5",
  },
  {
    id: "n4",
    programId: "bcvn-ksp",
    type: "report_generated",
    title: "Weekly report ready",
    body: "Your Week 1 progress report has been generated.",
    read: true,
    createdAt: "2026-03-02T09:00:00",
    linkTo: "/learn/progress",
  },
  {
    id: "n5",
    programId: "bcvn-ksp",
    type: "session_reminder",
    title: "Session tomorrow",
    body: "ISO8583 Message Parsing Workshop is scheduled for 14:00-16:00.",
    read: false,
    createdAt: "2026-03-02T18:00:00",
    linkTo: "/learn/schedule",
    relatedId: "s2",
  },
  {
    id: "n6",
    programId: "bcvn-ksp",
    type: "mission_due",
    title: "Mission overdue!",
    body: "Authorization Reversal Test Case was due on 2026-03-14.",
    read: false,
    createdAt: "2026-03-03T07:00:00",
    linkTo: "/learn/missions",
    relatedId: "m4",
  },
  // BCVN ADV
  {
    id: "n7",
    programId: "bcvn-adv",
    type: "session_reminder",
    title: "Upcoming session",
    body: "Production Monitoring Setup on March 10 at 10:00.",
    read: false,
    createdAt: "2026-03-03T06:00:00",
    linkTo: "/learn/schedule",
    relatedId: "s7",
  },
  {
    id: "n8",
    programId: "bcvn-adv",
    type: "mission_due",
    title: "Mission due in 11 days",
    body: "Monitoring Dashboard Setup is due on 2026-03-14.",
    read: true,
    createdAt: "2026-03-03T06:00:00",
    linkTo: "/learn/missions",
    relatedId: "m6",
  },
];

// ─── Recordings ────────────────────────────────────────────

export interface Recording {
  id: string;
  programId: string;
  weekId: string;
  sessionId: string;
  sessionTitle: string;
  date: string;
  duration: string;
  url: string;
  instructor: string;
}

export const recordings: Recording[] = [
  // BCVN KSP
  {
    id: "r1",
    programId: "bcvn-ksp",
    weekId: "ksp-w1",
    sessionId: "s1",
    sessionTitle: "BAIS Framework Architecture Overview",
    date: "2026-03-03",
    duration: "1h 52m",
    url: "https://example.com/recording/r1",
    instructor: "Felix",
  },
  {
    id: "r2",
    programId: "bcvn-ksp",
    weekId: "ksp-w2",
    sessionId: "s3",
    sessionTitle: "HSM Interface & PIN Block Processing",
    date: "2026-03-04",
    duration: "1h 28m",
    url: "https://example.com/recording/r2",
    instructor: "Felix",
  },
  {
    id: "r3",
    programId: "bcvn-ksp",
    weekId: "ksp-w2",
    sessionId: "s4",
    sessionTitle: "Authorization Logic Deep Dive",
    date: "2026-03-05",
    duration: "1h 55m",
    url: "https://example.com/recording/r3",
    instructor: "Felix",
  },
  {
    id: "r4",
    programId: "bcvn-ksp",
    weekId: "ksp-w3",
    sessionId: "s5",
    sessionTitle: "Merchant Lifecycle Management",
    date: "2026-03-06",
    duration: "2h 00m",
    url: "https://example.com/recording/r4",
    instructor: "Yosua",
  },
  // BCVN ADV
  {
    id: "r5",
    programId: "bcvn-adv",
    weekId: "adv-w1",
    sessionId: "s7",
    sessionTitle: "Production Monitoring Setup",
    date: "2026-03-10",
    duration: "1h 45m",
    url: "https://example.com/recording/r5",
    instructor: "Felix",
  },
];

// ─── Announcements ─────────────────────────────────────────

export interface Announcement {
  id: string;
  programId: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  author: string;
}

export const announcements: Announcement[] = [
  {
    id: "ann1",
    programId: "bcvn-ksp",
    title: "Phase 2 schedule updated",
    body: "Week 4-5 sessions have been rescheduled. Please check the updated schedule for details. Contact your instructor if you have any conflicts.",
    pinned: true,
    createdAt: "2026-03-03T09:00:00",
    author: "Admin Park",
  },
  {
    id: "ann2",
    programId: "bcvn-ksp",
    title: "Mission submission reminder",
    body: "Please submit all Week 1 missions by March 7. Late submissions will receive a 10% penalty.",
    pinned: false,
    createdAt: "2026-03-02T14:00:00",
    author: "Felix",
  },
  {
    id: "ann3",
    programId: "bcvn-ksp",
    title: "Lab environment maintenance",
    body: "The lab environment will be under maintenance on March 8 from 22:00 to 02:00 KST. Please save your work accordingly.",
    pinned: false,
    createdAt: "2026-03-01T10:00:00",
    author: "Admin Park",
  },
  {
    id: "ann4",
    programId: "bcvn-adv",
    title: "Incident drill scheduled",
    body: "A live incident response drill will be held on March 17. All participants must attend. Make sure to review the runbook template beforehand.",
    pinned: true,
    createdAt: "2026-03-03T08:00:00",
    author: "Riko",
  },
  {
    id: "ann5",
    programId: "bcvn-adv",
    title: "Monitoring tools access",
    body: "Grafana and ELK stack credentials have been shared via email. Set up your dashboards before the Week 1 session.",
    pinned: false,
    createdAt: "2026-03-02T10:00:00",
    author: "Felix",
  },
];