import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Trophy, User, Bell, Settings, Code2, LogOut, Zap } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../lib/utils";

const links = [
  { to: "/student", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/student/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/student/coding", icon: Code2, label: "Coding Arena" },
  { to: "/student/notifications", icon: Bell, label: "Notifications" },
  { to: "/student/profile", icon: User, label: "Profile" },
  { to: "/student/settings", icon: Settings, label: "Settings" },
];

export default function StudentSidebar() {
  const { logout } = useApp();
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 glass border-r border-surface-border px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-aurora flex items-center justify-center shadow-glow">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-ink leading-none">INTELLEXA</p>
          <p className="text-[10px] text-ink-faint font-mono tracking-wider">WEBDEV × DSA</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
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
                    className="absolute inset-0 bg-aurora rounded-xl -z-10 shadow-glow"
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
