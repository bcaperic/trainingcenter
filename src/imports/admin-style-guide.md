(A) 프로젝트/스타일 규칙

스타일: minimal admin, compact spacing, no illustration

8pt spacing system, dense table

색상: neutral gray + 1개 accent(blue)

컴포넌트: Button, Badge, Input, Select, Tabs, Table, Drawer(오른쪽 패널), Toast

레이아웃: Left sidebar(아이콘+텍스트), Top bar(페이지 타이틀+필터)

(B) 페이지 생성 지시

Login

email/password + sign in 버튼 (가짜로)

Dashboard

“This Week” summary cards 3개: Attendance %, Completion %, Points

Today sessions list (compact)

Upcoming deadlines list

Schedule

Week dropdown, Team dropdown, Search input

Sessions table: Date/Time, Type badge, Title, Capacity, Action(Enroll)

오른쪽 Drawer: Session details + Enroll/Cancel + Recording link(if exists)

Missions

Week dropdown

Missions list: Title, Due, Status badge, Submit button

Drawer: mission detail + submission form (link/text) + 제출 히스토리

Attendance & Progress

Week dropdown

Attendance table + progress bar(완료율)

Reports (role-based)

Week + Team 필터

Trainee list table: attendanceRate, completionRate, points, gateStatus

Export CSV button

(C) 컴팩트 UI 요구(중요)

테이블 row height 36px 수준(컴팩트)

Card padding 12~16px

폰트: 14px base, 헤더 16~18px

모달 최소화, Drawer 우선

한 화면에 정보 많이 담되 “화이트스페이스 과다 금지”