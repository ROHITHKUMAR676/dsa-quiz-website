import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FilePlus2,
  CalendarClock,
  Users,
  Trophy,
  BarChart3,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../lib/utils";
import BrandMark from "../brand/BrandMark";

const links = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/create-quiz", icon: FilePlus2, label: "Create Quiz" },
  { to: "/admin/scheduled", icon: CalendarClock, label: "Scheduled Quizzes" },
  { to: "/admin/participants", icon: Users, label: "Participants" },
  { to: "/admin/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

function Content({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useApp();
  return (
    <>
      <div className="px-2 mb-8">
        <BrandMark className="w-44 max-w-full" />
        <p className="mt-2 text-[10px] text-ink-faint font-mono tracking-wider">ADMIN CONSOLE</p>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
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
                    layoutId="admin-nav-active"
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
    </>
  );
}

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const { logout } = useApp();
  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 glass border-r border-surface-border px-4 py-6">
        <Content />
      </aside>

      <div className="lg:hidden sticky top-0 z-40 glass border-b border-surface-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrandMark className="w-32" />
          <span className="text-xs font-semibold text-ink-dim">ADMIN</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={logout} aria-label="Log out" title="Log out" className="p-2 rounded-lg hover:bg-state-danger/10 text-ink-dim hover:text-state-danger">
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={() => setOpen(true)} aria-label="Open admin menu" className="p-2 rounded-lg hover:bg-surface-light">
            <Menu className="w-5 h-5 text-ink" />
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-void-100/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="relative w-72 glass-strong h-full px-4 py-6 flex flex-col"
          >
            <Content onNavigate={() => setOpen(false)} />
          </motion.div>
        </div>
      )}
    </>
  );
}
