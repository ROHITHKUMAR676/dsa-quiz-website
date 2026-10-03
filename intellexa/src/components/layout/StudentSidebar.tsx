import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Trophy, User, Bell, Settings, LogOut } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../lib/utils";
import BrandMark from "../brand/BrandMark";

const links = [
  { to: "/student", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/student/leaderboard", icon: Trophy, label: "Leaderboard", tour: "nav-leaderboard" },
  { to: "/student/notifications", icon: Bell, label: "Notifications" },
  { to: "/student/profile", icon: User, label: "Profile", tour: "nav-profile" },
  { to: "/student/settings", icon: Settings, label: "Settings" },
];

export default function StudentSidebar() {
  const { logout } = useApp();
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 glass border-r border-surface-border px-4 py-6">
      <div className="px-2 mb-8">
        <BrandMark className="w-44 max-w-full" />
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            data-tour={link.tour}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
                isActive ? "text-white" : "text-ink-dim hover:text-ink hover:bg-surface-light"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="student-nav-active"
                    className="absolute inset-0 bg-aurora rounded-xl -z-10 shadow-pixel-sm"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <link.icon className="w-4.5 h-4.5 shrink-0" />
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-dim hover:text-state-danger hover:bg-state-danger/10 transition-colors"
      >
        <LogOut className="w-4.5 h-4.5" />
        Log out
      </button>
    </aside>
  );
}
