import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import FAQ from "./pages/FAQ";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentOutpass from "./pages/student/StudentOutpass";
import StudentMeetings from "./pages/student/StudentMeetings";
import StudentAvailability from "./pages/student/StudentAvailability";

// Staff pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffOutpass from "./pages/staff/StaffOutpass";
import StaffMeetings from "./pages/staff/StaffMeetings";
import StaffAttendance from "./pages/staff/StaffAttendance";
import StaffAvailabilityManage from "./pages/staff/StaffAvailabilityManage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/feedback" element={<Feedback />} />

            {/* Student routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/outpass"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentOutpass />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/meetings"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentMeetings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/availability"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentAvailability />
                </ProtectedRoute>
              }
            />

            {/* Staff routes */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/outpass"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffOutpass />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/meetings"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffMeetings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/attendance"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/availability"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffAvailabilityManage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/outpass"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <StaffOutpass />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/meetings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <StaffMeetings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/feedback"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminFeedback />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />

            {/* Change password (all roles) */}
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
