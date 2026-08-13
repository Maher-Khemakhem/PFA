import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/types";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
// Student
import SignupStudentPage from "./pages/student/SignupStudentPage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import TasksPage from "./pages/student/TasksPage";
import RecommendationsPage from "./pages/student/RecommendationsPage";
import StudentProjectsPage from "./pages/student/StudentProjectsPage";
import StudentEventsPage from "./pages/student/StudentEventsPage";
import StudentNotificationsPage from "./pages/student/StudentNotificationsPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import StudentChatPage from "./pages/student/StudentChatPage";
// Organisation
import SignupOrgPage from "./pages/org/SignupOrgPage";
import OrgDashboardPage from "./pages/org/OrgDashboardPage";
import CreateProjectPage from "./pages/org/CreateProjectPage";
import CreateEventPage from "./pages/org/CreateEventPage";
import MembersPage from "./pages/org/MembersPage";
import OrgProjectsPage from "./pages/org/OrgProjectsPage";
import OrgEventsPage from "./pages/org/OrgEventsPage";
import OrgStatisticsPage from "./pages/org/OrgStatisticsPage";
import OrgNotificationsPage from "./pages/org/OrgNotificationsPage";
import OrgProfilePage from "./pages/org/OrgProfilePage";
import OrgChatPage from "./pages/org/OrgChatPage";
// Admin
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminOrganizationsPage from "./pages/admin/AdminOrganizationsPage";
// Shared
import DashboardPage from "./pages/shared/DashboardPage";
import ProjectsListPage from "./pages/shared/ProjectsListPage";
import ProjectDetailsPage from "./pages/shared/ProjectDetailsPage";
import EventsPage from "./pages/shared/EventsPage";
import EventDetailsPage from "./pages/shared/EventDetailsPage";
import StatisticsPage from "./pages/shared/StatisticsPage";
import ProfilePage from "./pages/shared/ProfilePage";
import EditProfilePage from "./pages/shared/EditProfilePage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleProtectedRoute({
  allowed,
  children,
}: {
  allowed: UserRole[];
  children: React.ReactNode;
}) {
  const { isAuthenticated, userRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allowed.includes(userRole)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup/student" element={<SignupStudentPage />} />
      <Route path="/signup/organization" element={<SignupOrgPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/student" element={<RoleProtectedRoute allowed={["student"]}><StudentDashboardPage /></RoleProtectedRoute>} />
      <Route path="/dashboard/organization" element={<RoleProtectedRoute allowed={["organization"]}><OrgDashboardPage /></RoleProtectedRoute>} />
      <Route path="/dashboard/admin" element={<RoleProtectedRoute allowed={["admin"]}><AdminDashboardPage /></RoleProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
      <Route path="/projects/create" element={<RoleProtectedRoute allowed={["organization"]}><CreateProjectPage /></RoleProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailsPage /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
      <Route path="/events/create" element={<RoleProtectedRoute allowed={["organization"]}><CreateEventPage /></RoleProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetailsPage /></ProtectedRoute>} />
      <Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
      <Route path="/admin/students" element={<RoleProtectedRoute allowed={["admin"]}><AdminStudentsPage /></RoleProtectedRoute>} />
      <Route path="/admin/organizations" element={<RoleProtectedRoute allowed={["admin"]}><AdminOrganizationsPage /></RoleProtectedRoute>} />
      <Route path="/admin/projects" element={<RoleProtectedRoute allowed={["admin"]}><ProjectsListPage /></RoleProtectedRoute>} />
      <Route path="/admin/events" element={<RoleProtectedRoute allowed={["admin"]}><EventsPage /></RoleProtectedRoute>} />
      <Route path="/admin/statistics" element={<RoleProtectedRoute allowed={["admin"]}><StatisticsPage /></RoleProtectedRoute>} />
      {/* Student-specific routes */}
      <Route path="/student/projects" element={<RoleProtectedRoute allowed={["student"]}><StudentProjectsPage /></RoleProtectedRoute>} />
      <Route path="/student/tasks" element={<RoleProtectedRoute allowed={["student"]}><TasksPage /></RoleProtectedRoute>} />
      <Route path="/student/events" element={<RoleProtectedRoute allowed={["student"]}><StudentEventsPage /></RoleProtectedRoute>} />
      <Route path="/student/recommendations" element={<RoleProtectedRoute allowed={["student"]}><RecommendationsPage /></RoleProtectedRoute>} />
      <Route path="/student/notifications" element={<RoleProtectedRoute allowed={["student"]}><StudentNotificationsPage /></RoleProtectedRoute>} />
      <Route path="/student/profile" element={<RoleProtectedRoute allowed={["student"]}><StudentProfilePage /></RoleProtectedRoute>} />
      <Route path="/student/chat" element={<RoleProtectedRoute allowed={["student"]}><StudentChatPage /></RoleProtectedRoute>} />
      {/* Org-specific routes */}
      <Route path="/org/projects" element={<RoleProtectedRoute allowed={["organization"]}><OrgProjectsPage /></RoleProtectedRoute>} />
      <Route path="/org/events" element={<RoleProtectedRoute allowed={["organization"]}><OrgEventsPage /></RoleProtectedRoute>} />
      <Route path="/org/members" element={<RoleProtectedRoute allowed={["organization"]}><MembersPage /></RoleProtectedRoute>} />
      <Route path="/org/statistics" element={<RoleProtectedRoute allowed={["organization"]}><OrgStatisticsPage /></RoleProtectedRoute>} />
      <Route path="/org/notifications" element={<RoleProtectedRoute allowed={["organization"]}><OrgNotificationsPage /></RoleProtectedRoute>} />
      <Route path="/org/profile" element={<RoleProtectedRoute allowed={["organization"]}><OrgProfilePage /></RoleProtectedRoute>} />
      <Route path="/org/chat" element={<RoleProtectedRoute allowed={["organization"]}><OrgChatPage /></RoleProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
