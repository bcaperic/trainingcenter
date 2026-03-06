import { createBrowserRouter, Navigate } from "react-router";
import { AdminLayout } from "./components/AdminLayout";
import { LearnerLayout } from "./components/LearnerLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { VerifyEmail } from "./pages/VerifyEmail";

// Admin pages (operations)
import { Schedule } from "./pages/Schedule";
import { Missions } from "./pages/Missions";
import { Attendance } from "./pages/Attendance";
import { Reports } from "./pages/Reports";

// Admin pages (CMS)
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminPrograms } from "./pages/admin/AdminPrograms";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminTeams } from "./pages/admin/AdminTeams";
import { AdminCurriculum } from "./pages/admin/AdminCurriculum";
import { AdminSessions } from "./pages/admin/AdminSessions";
import { AdminAnnouncements } from "./pages/admin/AdminAnnouncements";

// Learner pages
import { LearnerHome } from "./pages/learner/LearnerHome";
import { LearnerSchedule } from "./pages/learner/LearnerSchedule";
import { LearnerMissions } from "./pages/learner/LearnerMissions";
import { LearnerProgress } from "./pages/learner/LearnerProgress";
import { LearnerProfile } from "./pages/learner/LearnerProfile";
import { LearnerRecordings } from "./pages/learner/LearnerRecordings";

// Mobile pages
import { MobileLayout } from "./components/MobileLayout";
import { MobileHome } from "./pages/mobile/MobileHome";
import { MobileSchedule } from "./pages/mobile/MobileSchedule";
import { MobileCheckin } from "./pages/mobile/MobileCheckin";
import { MobileMissions } from "./pages/mobile/MobileMissions";
import { MobileProfile } from "./pages/mobile/MobileProfile";
import { MobileNotifications } from "./pages/mobile/MobileNotifications";
import { MobileRecordings } from "./pages/mobile/MobileRecordings";

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  { path: "/signup", Component: SignUp },
  { path: "/forgot-password", Component: ForgotPassword },
  { path: "/reset-password", Component: ResetPassword },
  { path: "/verify-email", Component: VerifyEmail },
  // Admin Console — requires admin or instructor role
  {
    element: <ProtectedRoute allowedRoles={["admin", "instructor"]} />,
    children: [
      {
        path: "/admin",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: "schedule", Component: Schedule },
          { path: "missions", Component: Missions },
          { path: "attendance", Component: Attendance },
          { path: "reports", Component: Reports },
          // CMS
          { path: "programs", Component: AdminPrograms },
          { path: "users", Component: AdminUsers },
          { path: "teams", Component: AdminTeams },
          { path: "curriculum", Component: AdminCurriculum },
          { path: "sessions", Component: AdminSessions },
          { path: "announcements", Component: AdminAnnouncements },
        ],
      },
    ],
  },
  // Learner Portal — requires trainee role
  {
    element: <ProtectedRoute allowedRoles={["trainee"]} />,
    children: [
      {
        path: "/learn",
        Component: LearnerLayout,
        children: [
          { index: true, Component: LearnerHome },
          { path: "schedule", Component: LearnerSchedule },
          { path: "missions", Component: LearnerMissions },
          { path: "progress", Component: LearnerProgress },
          { path: "profile", Component: LearnerProfile },
          { path: "recordings", Component: LearnerRecordings },
        ],
      },
    ],
  },
  // Mobile Learner App — any authenticated user
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/m",
        Component: MobileLayout,
        children: [
          { index: true, Component: MobileHome },
          { path: "schedule", Component: MobileSchedule },
          { path: "checkin", Component: MobileCheckin },
          { path: "missions", Component: MobileMissions },
          { path: "profile", Component: MobileProfile },
          { path: "notifications", Component: MobileNotifications },
          { path: "recordings", Component: MobileRecordings },
        ],
      },
    ],
  },
  // Default redirect to login
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
