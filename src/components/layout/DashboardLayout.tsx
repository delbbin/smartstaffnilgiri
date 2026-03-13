import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  Building2,
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Activity,
  Clock,
  KeyRound,
  Settings,
  Shield,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "Outpass", href: "/student/outpass", icon: FileText },
  { label: "Meetings", href: "/student/meetings", icon: Calendar },
  { label: "Staff Availability", href: "/student/availability", icon: BarChart3 },
];

const staffNavItems: NavItem[] = [
  { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
  { label: "Meeting Requests", href: "/staff/meetings", icon: Calendar },
  { label: "My Availability", href: "/staff/availability", icon: Clock },
  { label: "My Attendance", href: "/staff/attendance", icon: Activity },
];

const hodNavItems: NavItem[] = [
  { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
  { label: "Outpass Requests", href: "/staff/outpass", icon: FileText },
  { label: "Meeting Requests", href: "/staff/meetings", icon: Calendar },
  { label: "My Availability", href: "/staff/availability", icon: Clock },
  { label: "Manage Availability", href: "/staff/manage-availability", icon: Users },
  { label: "My Attendance", href: "/staff/attendance", icon: Activity },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Outpass Overview", href: "/admin/outpass", icon: FileText },
  { label: "Meetings Overview", href: "/admin/meetings", icon: Calendar },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { label: "Organization", href: "/admin/organization", icon: Settings },
];

const securityNavItems: NavItem[] = [
  { label: "Dashboard", href: "/security", icon: LayoutDashboard },
  { label: "History", href: "/security/history", icon: History },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { profile, signOut, isHod } = useAuth();
  const { organization } = useOrganization();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getNavItems = (): NavItem[] => {
    switch (profile?.role) {
      case "admin":
        return adminNavItems;
      case "staff":
        return isHod ? hodNavItems : staffNavItems;
      case "student":
        return studentNavItems;
      case "security":
        return securityNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleLabel = () => {
    switch (profile?.role) {
      case "admin": return "Administrator";
      case "staff": return isHod ? "HOD" : "Staff Member";
      case "student": return "Student";
      case "security": return "Security";
      default: return "User";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold">StaffHub</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo + Org */}
          <div className="h-16 flex items-center gap-2 px-4 border-b border-border">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <span className="font-display font-bold text-lg block truncate">StaffHub</span>
              {organization && (
                <span className="text-xs text-muted-foreground block truncate">{organization.name}</span>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{getRoleLabel()}</p>
            </div>
            <div className="hidden lg:block">
              <NotificationBell />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => { navigate("/change-password"); setSidebarOpen(false); }}
            >
              <KeyRound className="w-4 h-4" />
              Change Password
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => { navigate("/"); setSidebarOpen(false); }}
            >
              <Building2 className="w-4 h-4" />
              Back to Home
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
};
