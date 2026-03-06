import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Training Hub database...');

  // Clean existing data
  await prisma.mailLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.weeklyReport.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.session.deleteMany();
  await prisma.week.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.programMembership.deleteMany();
  await prisma.team.deleteMany();
  await prisma.program.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('admin123', 10);

  // ──────────────── Users ────────────────
  // All seed accounts use password: admin123, emailVerified: true
  const ud = (email: string, name: string, status: 'ACTIVE' | 'DISABLED' = 'ACTIVE') =>
    ({ email, passwordHash, name, status, emailVerified: true });

  const users = await Promise.all([
    prisma.user.create({ data: ud('eric.yoon@bccard-ap.com', 'Eric Yoon') }),
    prisma.user.create({ data: ud('admin.park@company.com', 'Admin Park') }),
    prisma.user.create({ data: ud('felix@company.com', 'Felix') }),
    prisma.user.create({ data: ud('andar@company.com', 'Andar') }),
    prisma.user.create({ data: ud('riko@company.com', 'Riko') }),
    prisma.user.create({ data: ud('yosua@company.com', 'Yosua') }),
    prisma.user.create({ data: ud('nguyen.a@company.com', 'Nguyen Van A') }),
    prisma.user.create({ data: ud('tran.b@company.com', 'Tran Thi B') }),
    prisma.user.create({ data: ud('le.c@company.com', 'Le Van C') }),
    prisma.user.create({ data: ud('pham.d@company.com', 'Pham Duc D') }),
    prisma.user.create({ data: ud('hoang.e@company.com', 'Hoang Van E', 'DISABLED') }),
    prisma.user.create({ data: ud('do.f@company.com', 'Do Thi F') }),
    prisma.user.create({ data: ud('vo.g@company.com', 'Vo Van G') }),
  ]);
  const [ericYoon, adminPark, felix, andar, riko, yosua, nguyenA, tranB, leC, phamD, hoangE, doF, voG] = users;
  console.log(`Created ${users.length} users`);

  // ──────────────── Programs ────────────────
  const programs = await Promise.all([
    prisma.program.create({
      data: {
        name: 'Developer Foundations',
        shortName: 'DEV FDN',
        description: 'Code-level troubleshooting and independent operations capability building',
        duration: '24 weeks',
        status: 'ACTIVE',
        startDate: new Date('2026-03-02'),
        endDate: new Date('2026-08-21'),
      },
    }),
    prisma.program.create({
      data: {
        name: 'Advanced Operations',
        shortName: 'ADV OPS',
        description: 'Advanced operations and incident response program',
        duration: '12 weeks',
        status: 'ACTIVE',
        startDate: new Date('2026-03-09'),
        endDate: new Date('2026-05-29'),
      },
    }),
    prisma.program.create({
      data: {
        name: 'New Developer Onboarding',
        shortName: 'NEW DEV',
        description: 'New developer onboarding and training program',
        duration: '8 weeks',
        status: 'DRAFT',
      },
    }),
  ]);
  const [devFdn, advOps, newDev] = programs;
  console.log(`Created ${programs.length} programs`);

  // ──────────────── Teams (DEV FDN program) ────────────────
  const teams = await Promise.all([
    prisma.team.create({ data: { programId: devFdn.id, name: 'Auth Team', leadUserId: felix.id } }),
    prisma.team.create({ data: { programId: devFdn.id, name: 'CnS Team', leadUserId: andar.id } }),
    prisma.team.create({ data: { programId: devFdn.id, name: 'Merchant/WDS/TMS Team', leadUserId: yosua.id } }),
  ]);
  const [authTeam, cnsTeam, merchantTeam] = teams;

  // Teams for ADV OPS
  const advTeams = await Promise.all([
    prisma.team.create({ data: { programId: advOps.id, name: 'Auth Team', leadUserId: felix.id } }),
    prisma.team.create({ data: { programId: advOps.id, name: 'CnS Team', leadUserId: andar.id } }),
    prisma.team.create({ data: { programId: advOps.id, name: 'Merchant/WDS/TMS Team' } }),
  ]);
  const [advAuthTeam, advCnsTeam, advMerchantTeam] = advTeams;
  console.log(`Created ${teams.length + advTeams.length} teams`);

  // ──────────────── Program Memberships ────────────────
  // DEV FDN memberships
  await Promise.all([
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: ericYoon.id, role: 'ADMIN' } }),
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: adminPark.id, role: 'ADMIN' } }),
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: felix.id, role: 'INSTRUCTOR', teamId: authTeam.id } }),
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: andar.id, role: 'INSTRUCTOR', teamId: cnsTeam.id } }),
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: yosua.id, role: 'INSTRUCTOR', teamId: merchantTeam.id } }),
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: nguyenA.id, role: 'TRAINEE', teamId: authTeam.id } }),
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: tranB.id, role: 'TRAINEE', teamId: cnsTeam.id } }),
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: leC.id, role: 'TRAINEE', teamId: cnsTeam.id } }),
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: phamD.id, role: 'TRAINEE', teamId: merchantTeam.id } }),
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: hoangE.id, role: 'TRAINEE', teamId: merchantTeam.id } }),
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: doF.id, role: 'TRAINEE', teamId: authTeam.id } }),
    prisma.programMembership.create({ data: { programId: devFdn.id, userId: voG.id, role: 'TRAINEE', teamId: cnsTeam.id } }),
  ]);

  // ADV OPS memberships
  await Promise.all([
    prisma.programMembership.create({ data: { programId: advOps.id, userId: ericYoon.id, role: 'ADMIN' } }),
    prisma.programMembership.create({ data: { programId: advOps.id, userId: adminPark.id, role: 'ADMIN' } }),
    prisma.programMembership.create({ data: { programId: advOps.id, userId: felix.id, role: 'INSTRUCTOR', teamId: advAuthTeam.id } }),
    prisma.programMembership.create({ data: { programId: advOps.id, userId: andar.id, role: 'INSTRUCTOR', teamId: advCnsTeam.id } }),
    prisma.programMembership.create({ data: { programId: advOps.id, userId: riko.id, role: 'INSTRUCTOR', teamId: advCnsTeam.id } }),
    prisma.programMembership.create({ data: { programId: advOps.id, userId: nguyenA.id, role: 'TRAINEE', teamId: advAuthTeam.id } }),
    prisma.programMembership.create({ data: { programId: advOps.id, userId: tranB.id, role: 'TRAINEE', teamId: advCnsTeam.id } }),
    prisma.programMembership.create({ data: { programId: advOps.id, userId: phamD.id, role: 'TRAINEE', teamId: advMerchantTeam.id } }),
  ]);

  // NEW DEV memberships
  await prisma.programMembership.create({ data: { programId: newDev.id, userId: ericYoon.id, role: 'ADMIN' } });
  await prisma.programMembership.create({ data: { programId: newDev.id, userId: adminPark.id, role: 'ADMIN' } });
  console.log('Created program memberships');

  // ──────────────── Weeks ────────────────
  const weeks = await Promise.all([
    // DEV FDN weeks
    prisma.week.create({ data: { programId: devFdn.id, weekNo: 1, title: 'Framework & Message Parsing', startDate: new Date('2026-03-02'), endDate: new Date('2026-03-06'), status: 'PUBLISHED' } }),
    prisma.week.create({ data: { programId: devFdn.id, weekNo: 2, title: 'Security & Authorization', startDate: new Date('2026-03-09'), endDate: new Date('2026-03-13'), status: 'PUBLISHED' } }),
    prisma.week.create({ data: { programId: devFdn.id, weekNo: 3, title: 'Merchant & Settlement', startDate: new Date('2026-03-16'), endDate: new Date('2026-03-20'), status: 'PUBLISHED' } }),
    prisma.week.create({ data: { programId: devFdn.id, weekNo: 4, title: 'Error Handling & Testing', startDate: new Date('2026-03-23'), endDate: new Date('2026-03-27'), status: 'DRAFT' } }),
    prisma.week.create({ data: { programId: devFdn.id, weekNo: 5, title: 'Performance Tuning', startDate: new Date('2026-03-30'), endDate: new Date('2026-04-03'), status: 'DRAFT' } }),
    // ADV OPS weeks
    prisma.week.create({ data: { programId: advOps.id, weekNo: 1, title: 'Monitoring Foundations', startDate: new Date('2026-03-09'), endDate: new Date('2026-03-13'), status: 'PUBLISHED' } }),
    prisma.week.create({ data: { programId: advOps.id, weekNo: 2, title: 'Log & APM Analysis', startDate: new Date('2026-03-16'), endDate: new Date('2026-03-20'), status: 'PUBLISHED' } }),
    prisma.week.create({ data: { programId: advOps.id, weekNo: 3, title: 'Incident Response', startDate: new Date('2026-03-23'), endDate: new Date('2026-03-27'), status: 'DRAFT' } }),
  ]);
  const [kspW1, kspW2, kspW3, kspW4, kspW5, advW1, advW2, advW3] = weeks;
  console.log(`Created ${weeks.length} weeks`);

  // ──────────────── Sessions ────────────────
  const sessions = await Promise.all([
    // DEV FDN sessions
    prisma.session.create({
      data: {
        programId: devFdn.id, weekId: kspW1.id, type: 'LIVE', title: 'BAIS Framework Architecture Overview',
        description: 'BAIS 프레임워크의 계층 구조(Handler, Adapter, Service) 및 데이터 흐름 파악.',
        startAt: new Date('2026-03-03T10:00:00+09:00'), endAt: new Date('2026-03-03T12:00:00+09:00'),
        capacity: 10, locationOrUrl: 'https://meet.google.com/abc', status: 'PUBLISHED', checkinMode: 'CODE',
        checkinOpenAt: new Date('2026-03-03T09:50:00+09:00'), checkinCloseAt: new Date('2026-03-03T10:15:00+09:00'),
      },
    }),
    prisma.session.create({
      data: {
        programId: devFdn.id, weekId: kspW1.id, type: 'LIVE', title: 'ISO8583 Message Parsing Workshop',
        description: 'ISO8583 브랜드사 전문과 내부 표준 전문 간의 매핑 테이블 및 파싱 로직 실습.',
        startAt: new Date('2026-03-03T14:00:00+09:00'), endAt: new Date('2026-03-03T16:00:00+09:00'),
        capacity: 5, status: 'PUBLISHED', checkinMode: 'CODE',
        checkinOpenAt: new Date('2026-03-03T13:50:00+09:00'), checkinCloseAt: new Date('2026-03-03T14:15:00+09:00'),
      },
    }),
    prisma.session.create({
      data: {
        programId: devFdn.id, weekId: kspW2.id, type: 'LIVE', title: 'HSM Interface & PIN Block Processing',
        description: 'HSM 인터페이스 기반의 PIN Block 처리 및 Key 교환 프로세스 학습.',
        startAt: new Date('2026-03-04T10:00:00+09:00'), endAt: new Date('2026-03-04T11:30:00+09:00'),
        capacity: 10, locationOrUrl: 'https://meet.google.com/def', status: 'PUBLISHED', checkinMode: 'CODE',
        checkinOpenAt: new Date('2026-03-04T09:50:00+09:00'), checkinCloseAt: new Date('2026-03-04T10:15:00+09:00'),
      },
    }),
    prisma.session.create({
      data: {
        programId: devFdn.id, weekId: kspW2.id, type: 'LIVE', title: 'Authorization Logic Deep Dive',
        description: '유효성 검사 로직, 거래 라우팅, 망 취소(Reversal) 처리 흐름 분석.',
        startAt: new Date('2026-03-05T09:00:00+09:00'), endAt: new Date('2026-03-05T11:00:00+09:00'),
        capacity: 10, locationOrUrl: 'https://meet.google.com/ghi', status: 'PUBLISHED', checkinMode: 'CODE',
        checkinOpenAt: new Date('2026-03-05T08:50:00+09:00'), checkinCloseAt: new Date('2026-03-05T09:15:00+09:00'),
      },
    }),
    prisma.session.create({
      data: {
        programId: devFdn.id, weekId: kspW3.id, type: 'LIVE', title: 'Merchant Lifecycle Management',
        description: '가맹점 라이프사이클(신규~해지) 및 수수료(MDR) 적용 우선순위 계산 로직.',
        startAt: new Date('2026-03-06T14:00:00+09:00'), endAt: new Date('2026-03-06T16:00:00+09:00'),
        capacity: 0, recordingUrl: 'https://example.com/recording/s5', status: 'ENDED', checkinMode: 'CODE',
      },
    }),
    prisma.session.create({
      data: {
        programId: devFdn.id, weekId: kspW3.id, type: 'LIVE', title: 'Clearing & Settlement Process',
        description: 'Incoming/Outgoing 파일 파싱 프로그램 분석 및 정산 불일치 시 대사(Recon) 프로세스.',
        startAt: new Date('2026-03-07T10:00:00+09:00'), endAt: new Date('2026-03-07T12:00:00+09:00'),
        capacity: 10, status: 'CANCELED', checkinMode: 'CODE',
      },
    }),
    // ADV OPS sessions
    prisma.session.create({
      data: {
        programId: advOps.id, weekId: advW1.id, type: 'LIVE', title: 'Production Monitoring Setup',
        description: '운영 환경 모니터링 시스템 구성 및 알림 설정 실습.',
        startAt: new Date('2026-03-10T10:00:00+09:00'), endAt: new Date('2026-03-10T12:00:00+09:00'),
        capacity: 8, locationOrUrl: 'https://meet.google.com/jkl', status: 'PUBLISHED', checkinMode: 'CODE',
        checkinOpenAt: new Date('2026-03-10T09:50:00+09:00'), checkinCloseAt: new Date('2026-03-10T10:15:00+09:00'),
      },
    }),
    prisma.session.create({
      data: {
        programId: advOps.id, weekId: advW1.id, type: 'LIVE', title: 'Log Analysis & APM Tools',
        description: 'ELK 스택 기반 로그 분석 및 APM 도구 활용법.',
        startAt: new Date('2026-03-11T14:00:00+09:00'), endAt: new Date('2026-03-11T16:00:00+09:00'),
        capacity: 8, status: 'PUBLISHED', checkinMode: 'CODE',
        checkinOpenAt: new Date('2026-03-11T13:50:00+09:00'), checkinCloseAt: new Date('2026-03-11T14:15:00+09:00'),
      },
    }),
    prisma.session.create({
      data: {
        programId: advOps.id, weekId: advW3.id, type: 'DRILL', title: 'Incident Response Drill',
        description: '장애 상황 시뮬레이션 및 대응 훈련 (MTTR 30분 목표).',
        startAt: new Date('2026-03-17T09:00:00+09:00'), endAt: new Date('2026-03-17T12:00:00+09:00'),
        capacity: 8, status: 'PUBLISHED', checkinMode: 'CODE',
        checkinOpenAt: new Date('2026-03-17T08:50:00+09:00'), checkinCloseAt: new Date('2026-03-17T09:15:00+09:00'),
      },
    }),
  ]);
  const [s1, s2, s3, s4, s5, s6, s7, s8, s9] = sessions;
  console.log(`Created ${sessions.length} sessions`);

  // ──────────────── Missions ────────────────
  const missions = await Promise.all([
    // DEV FDN missions
    prisma.mission.create({ data: { programId: devFdn.id, weekId: kspW1.id, type: 'REPORT', title: 'BAIS Architecture Diagram', description: 'BAIS 프레임워크의 계층 구조를 분석하고, Handler → Adapter → Service 흐름을 다이어그램으로 작성하세요.', dueAt: new Date('2026-03-07'), status: 'PUBLISHED' } }),
    prisma.mission.create({ data: { programId: devFdn.id, weekId: kspW1.id, type: 'REPORT', title: 'ISO8583 Field Mapping Table', description: '브랜드사 전문(Visa/Master)과 내부 표준 전문 간의 매핑 테이블을 작성하세요.', dueAt: new Date('2026-03-07'), status: 'PUBLISHED' } }),
    prisma.mission.create({ data: { programId: devFdn.id, weekId: kspW2.id, type: 'REPORT', title: 'PIN Block Encryption Flow Analysis', description: 'HSM을 이용한 PIN Block 암호화/복호화 흐름을 분석하고 시퀀스 다이어그램을 제출하세요.', dueAt: new Date('2026-03-10'), status: 'PUBLISHED' } }),
    prisma.mission.create({ data: { programId: devFdn.id, weekId: kspW2.id, type: 'TEST', title: 'Authorization Reversal Test Case', description: '망 취소(Reversal) 시나리오 5개를 정의하고, 각 시나리오별 테스트 케이스를 작성하세요.', dueAt: new Date('2026-03-14'), status: 'PUBLISHED' } }),
    prisma.mission.create({ data: { programId: devFdn.id, weekId: kspW3.id, type: 'CODE', title: 'MDR Calculation Logic Review', description: '가맹점 수수료(MDR) 적용 우선순위 계산 로직을 코드 리뷰하고 개선점을 제안하세요.', dueAt: new Date('2026-03-21'), status: 'PUBLISHED' } }),
    prisma.mission.create({ data: { programId: devFdn.id, weekId: kspW4.id, type: 'REPORT', title: 'Exception Handling Audit', description: '예외 처리 로직 감사 보고서를 작성하세요.', dueAt: new Date('2026-03-28'), status: 'DRAFT' } }),
    prisma.mission.create({ data: { programId: devFdn.id, weekId: kspW4.id, type: 'TEST', title: 'Week 4 Knowledge Quiz', description: '4주차 학습 내용에 대한 퀴즈입니다.', dueAt: new Date('2026-03-28'), status: 'DRAFT' } }),
    // ADV OPS missions
    prisma.mission.create({ data: { programId: advOps.id, weekId: advW1.id, type: 'CODE', title: 'Monitoring Dashboard Setup', description: 'Grafana 기반 운영 대시보드를 구성하고 주요 메트릭 5개를 설정하세요.', dueAt: new Date('2026-03-14'), status: 'PUBLISHED' } }),
    prisma.mission.create({ data: { programId: advOps.id, weekId: advW3.id, type: 'REPORT', title: 'Incident Runbook Draft', description: '주요 장애 유형 3가지에 대한 대응 런북을 작성하세요.', dueAt: new Date('2026-03-21'), status: 'DRAFT' } }),
  ]);
  const [m1, m2, m3, m4, m5, m6, m7, m8, m9] = missions;
  console.log(`Created ${missions.length} missions`);

  // ──────────────── Submissions ────────────────
  await Promise.all([
    prisma.submission.create({
      data: {
        programId: devFdn.id, missionId: m1.id, userId: nguyenA.id,
        contentUrl: 'https://docs.google.com/drawings/d/example1',
        status: 'REVIEWED', score: 85,
        submittedAt: new Date('2026-03-05'),
      },
    }),
    prisma.submission.create({
      data: {
        programId: devFdn.id, missionId: m5.id, userId: nguyenA.id,
        contentText: 'MDR 계산 로직 분석 완료. 우선순위: BIN > MCC > Default. 개선점: 캐시 적용 권장.',
        status: 'REVIEWED', score: 92,
        submittedAt: new Date('2026-03-18'),
      },
    }),
  ]);
  console.log('Created 2 submissions');

  // ──────────────── Enrollments ────────────────
  await Promise.all([
    // Nguyen Van A enrolled in s1, s4, s7 (matching mock `enrolled: true`)
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s1.id, userId: nguyenA.id, status: 'APPLIED' } }),
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s4.id, userId: nguyenA.id, status: 'APPLIED' } }),
    prisma.enrollment.create({ data: { programId: advOps.id, sessionId: s7.id, userId: nguyenA.id, status: 'APPLIED' } }),
    // Additional enrollments to match capacity counts
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s1.id, userId: tranB.id, status: 'APPLIED' } }),
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s1.id, userId: leC.id, status: 'APPLIED' } }),
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s1.id, userId: phamD.id, status: 'APPLIED' } }),
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s1.id, userId: doF.id, status: 'APPLIED' } }),
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s1.id, userId: voG.id, status: 'APPLIED' } }),
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s2.id, userId: tranB.id, status: 'APPLIED' } }),
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s2.id, userId: leC.id, status: 'APPLIED' } }),
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s2.id, userId: phamD.id, status: 'APPLIED' } }),
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s2.id, userId: doF.id, status: 'APPLIED' } }),
    prisma.enrollment.create({ data: { programId: devFdn.id, sessionId: s2.id, userId: voG.id, status: 'APPLIED' } }),
  ]);
  console.log('Created enrollments');

  // ──────────────── Attendance ────────────────
  await Promise.all([
    prisma.attendance.create({ data: { programId: devFdn.id, sessionId: s1.id, userId: nguyenA.id, status: 'PRESENT', method: 'CODE', checkedInAt: new Date('2026-03-03T09:58:00+09:00') } }),
    prisma.attendance.create({ data: { programId: devFdn.id, sessionId: s2.id, userId: nguyenA.id, status: 'PRESENT', method: 'CODE', checkedInAt: new Date('2026-03-03T13:55:00+09:00') } }),
    prisma.attendance.create({ data: { programId: devFdn.id, sessionId: s3.id, userId: nguyenA.id, status: 'LATE', method: 'CODE', checkedInAt: new Date('2026-03-04T10:08:00+09:00') } }),
    prisma.attendance.create({ data: { programId: devFdn.id, sessionId: s4.id, userId: nguyenA.id, status: 'PRESENT', method: 'CODE', checkedInAt: new Date('2026-03-05T08:55:00+09:00') } }),
    prisma.attendance.create({ data: { programId: devFdn.id, sessionId: s5.id, userId: nguyenA.id, status: 'ABSENT' } }),
    prisma.attendance.create({ data: { programId: devFdn.id, sessionId: s6.id, userId: nguyenA.id, status: 'EXCUSED' } }),
    prisma.attendance.create({ data: { programId: advOps.id, sessionId: s7.id, userId: nguyenA.id, status: 'PRESENT', method: 'CODE', checkedInAt: new Date('2026-03-10T09:55:00+09:00') } }),
    prisma.attendance.create({ data: { programId: advOps.id, sessionId: s8.id, userId: nguyenA.id, status: 'PRESENT', method: 'CODE', checkedInAt: new Date('2026-03-11T13:58:00+09:00') } }),
  ]);
  console.log('Created 8 attendance records');

  // ──────────────── Announcements ────────────────
  await Promise.all([
    prisma.announcement.create({
      data: {
        programId: devFdn.id, title: 'Phase 2 schedule updated',
        body: 'Week 4-5 sessions have been rescheduled. Please check the updated schedule for details. Contact your instructor if you have any conflicts.',
        isPinned: true, status: 'PUBLISHED', authorId: adminPark.id, publishedAt: new Date('2026-03-03T09:00:00'),
        createdAt: new Date('2026-03-03T09:00:00'),
      },
    }),
    prisma.announcement.create({
      data: {
        programId: devFdn.id, title: 'Mission submission reminder',
        body: 'Please submit all Week 1 missions by March 7. Late submissions will receive a 10% penalty.',
        isPinned: false, status: 'PUBLISHED', authorId: felix.id, publishedAt: new Date('2026-03-02T14:00:00'),
        createdAt: new Date('2026-03-02T14:00:00'),
      },
    }),
    prisma.announcement.create({
      data: {
        programId: devFdn.id, title: 'Lab environment maintenance',
        body: 'The lab environment will be under maintenance on March 8 from 22:00 to 02:00 KST. Please save your work accordingly.',
        isPinned: false, status: 'PUBLISHED', authorId: adminPark.id, publishedAt: new Date('2026-03-01T10:00:00'),
        createdAt: new Date('2026-03-01T10:00:00'),
      },
    }),
    prisma.announcement.create({
      data: {
        programId: advOps.id, title: 'Incident drill scheduled',
        body: 'A live incident response drill will be held on March 17. All participants must attend. Make sure to review the runbook template beforehand.',
        isPinned: true, status: 'PUBLISHED', authorId: riko.id, publishedAt: new Date('2026-03-03T08:00:00'),
        createdAt: new Date('2026-03-03T08:00:00'),
      },
    }),
    prisma.announcement.create({
      data: {
        programId: advOps.id, title: 'Monitoring tools access',
        body: 'Grafana and ELK stack credentials have been shared via email. Set up your dashboards before the Week 1 session.',
        isPinned: false, status: 'PUBLISHED', authorId: felix.id, publishedAt: new Date('2026-03-02T10:00:00'),
        createdAt: new Date('2026-03-02T10:00:00'),
      },
    }),
  ]);
  console.log('Created 5 announcements');

  // ──────────────── Notifications ────────────────
  await Promise.all([
    prisma.notification.create({
      data: {
        programId: devFdn.id, userId: nguyenA.id, type: 'SESSION_REMINDER',
        title: 'Session in 30 minutes', body: 'BAIS Framework Architecture Overview starts at 10:00.',
        isRead: false, linkPath: '/learn/schedule', createdAt: new Date('2026-03-03T09:30:00'),
      },
    }),
    prisma.notification.create({
      data: {
        programId: devFdn.id, userId: nguyenA.id, type: 'MISSION_DUE',
        title: 'Mission due tomorrow', body: 'ISO8583 Field Mapping Table is due on 2026-03-07.',
        isRead: false, linkPath: '/learn/missions', createdAt: new Date('2026-03-03T08:00:00'),
      },
    }),
    prisma.notification.create({
      data: {
        programId: devFdn.id, userId: nguyenA.id, type: 'RECORDING_READY',
        title: 'Recording available', body: 'Merchant Lifecycle Management recording has been uploaded.',
        isRead: true, linkPath: '/learn/recordings', createdAt: new Date('2026-03-02T16:00:00'),
      },
    }),
    prisma.notification.create({
      data: {
        programId: devFdn.id, userId: nguyenA.id, type: 'REPORT_READY',
        title: 'Weekly report ready', body: 'Your Week 1 progress report has been generated.',
        isRead: true, linkPath: '/learn/progress', createdAt: new Date('2026-03-02T09:00:00'),
      },
    }),
    prisma.notification.create({
      data: {
        programId: devFdn.id, userId: nguyenA.id, type: 'SESSION_REMINDER',
        title: 'Session tomorrow', body: 'ISO8583 Message Parsing Workshop is scheduled for 14:00-16:00.',
        isRead: false, linkPath: '/learn/schedule', createdAt: new Date('2026-03-02T18:00:00'),
      },
    }),
    prisma.notification.create({
      data: {
        programId: devFdn.id, userId: nguyenA.id, type: 'MISSION_DUE',
        title: 'Mission overdue!', body: 'Authorization Reversal Test Case was due on 2026-03-14.',
        isRead: false, linkPath: '/learn/missions', createdAt: new Date('2026-03-03T07:00:00'),
      },
    }),
    prisma.notification.create({
      data: {
        programId: advOps.id, userId: nguyenA.id, type: 'SESSION_REMINDER',
        title: 'Upcoming session', body: 'Production Monitoring Setup on March 10 at 10:00.',
        isRead: false, linkPath: '/learn/schedule', createdAt: new Date('2026-03-03T06:00:00'),
      },
    }),
    prisma.notification.create({
      data: {
        programId: advOps.id, userId: nguyenA.id, type: 'MISSION_DUE',
        title: 'Mission due in 11 days', body: 'Monitoring Dashboard Setup is due on 2026-03-14.',
        isRead: true, linkPath: '/learn/missions', createdAt: new Date('2026-03-03T06:00:00'),
      },
    }),
  ]);
  console.log('Created 8 notifications');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
