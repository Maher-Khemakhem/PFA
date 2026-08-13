import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  BarChart3,
  Bell,
  Lightbulb,
  User,
  LogOut,
  GraduationCap,
  Building2,
  ShieldCheck,
  ListTodo,
  Users,
  Settings,
  MessageCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/types";
import { SmartImage } from "@/components/SmartImage";
import { avatarPhoto, imageCandidates, organizationPhoto } from "@/lib/images";

const studentNav = [
  { title: "Dashboard", url: "/dashboard/student", icon: LayoutDashboard },
  { title: "Mes Projets", url: "/student/projects", icon: FolderKanban },
  { title: "Projets publics", url: "/projects", icon: FolderKanban },
  { title: "Mes Tâches", url: "/student/tasks", icon: ListTodo },
  { title: "Événements", url: "/student/events", icon: CalendarDays },
  { title: "Chat", url: "/student/chat", icon: MessageCircle },
  {
    title: "Recommandations",
    url: "/student/recommendations",
    icon: Lightbulb,
  },
  { title: "Notifications", url: "/student/notifications", icon: Bell },
  { title: "Profil", url: "/student/profile", icon: User },
];

const orgNav = [
  { title: "Dashboard", url: "/dashboard/organization", icon: LayoutDashboard },
  { title: "Projets", url: "/org/projects", icon: FolderKanban },
  { title: "Événements", url: "/org/events", icon: CalendarDays },
  { title: "Chat", url: "/org/chat", icon: MessageCircle },
  { title: "Membres", url: "/org/members", icon: Users },
  { title: "Statistiques", url: "/org/statistics", icon: BarChart3 },
  { title: "Notifications", url: "/org/notifications", icon: Bell },
  { title: "Profil", url: "/org/profile", icon: Settings },
];

const adminNav = [
  { title: "Dashboard", url: "/dashboard/admin", icon: LayoutDashboard },
  { title: "Étudiants", url: "/admin/students", icon: GraduationCap },
  { title: "Organisations", url: "/admin/organizations", icon: Building2 },
  { title: "Projets", url: "/admin/projects", icon: FolderKanban },
  { title: "Événements", url: "/admin/events", icon: CalendarDays },
  { title: "Statistiques", url: "/admin/statistics", icon: BarChart3 },
];

const ROLE_KEY = "active_role";
const FST_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/fr/8/8d/FSTLOGO.svg";

function roleFromPath(pathname: string): UserRole {
  if (
    pathname.startsWith("/dashboard/admin") ||
    pathname.startsWith("/admin/")
  ) {
    sessionStorage.setItem(ROLE_KEY, "admin");
    return "admin";
  }
  if (
    pathname.startsWith("/dashboard/organization") ||
    pathname.startsWith("/org/")
  ) {
    sessionStorage.setItem(ROLE_KEY, "organization");
    return "organization";
  }
  if (
    pathname.startsWith("/dashboard/student") ||
    pathname.startsWith("/student/")
  ) {
    sessionStorage.setItem(ROLE_KEY, "student");
    return "student";
  }
  // Shared pages (e.g. /projects/:id): reuse last known role
  const saved = sessionStorage.getItem(ROLE_KEY) as UserRole | null;
  return saved ?? "student";
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { userRole: authRole, isAuthenticated, userName, logout } = useAuth();
  const { pathname } = useLocation();

  const userRole: UserRole = isAuthenticated
    ? authRole
    : roleFromPath(pathname);

  const navItems =
    userRole === "admin"
      ? adminNav
      : userRole === "organization"
        ? orgNav
        : studentNav;
  const roleLabel =
    userRole === "admin"
      ? "Admin"
      : userRole === "organization"
        ? "Organisation"
        : "Étudiant";
  const RoleIcon =
    userRole === "admin"
      ? ShieldCheck
      : userRole === "organization"
        ? Building2
        : GraduationCap;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-sidebar-border p-1">
                <img
                  src={FST_LOGO_URL}
                  alt="FST"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h2 className="font-display font-bold text-sm text-sidebar-foreground">
                  FSTEAM
                </h2>
                <p className="text-xs text-sidebar-foreground/60">
                  Faculte des Sciences
                </p>
              </div>
            </div>
          ) : (
            <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center mx-auto border border-sidebar-border p-1">
              <img
                src={FST_LOGO_URL}
                alt="FST"
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Role Badge */}
        {!collapsed && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent">
              <RoleIcon className="h-4 w-4 text-sidebar-primary" />
              <span className="text-xs font-medium text-sidebar-accent-foreground">
                {roleLabel}
              </span>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User + Logout */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-sidebar-accent overflow-hidden shrink-0">
                  <SmartImage
                    sources={imageCandidates(
                      undefined,
                      userRole === "organization"
                        ? organizationPhoto(userName)
                        : avatarPhoto(userName),
                    )}
                    alt={userName || "Utilisateur"}
                  />
                </div>
                <span className="text-xs text-sidebar-foreground truncate max-w-[120px]">
                  {userName}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground mx-auto block"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
