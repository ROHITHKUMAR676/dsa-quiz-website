import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Trophy, Bell, User } from "lucide-react";
import { cn } from "../../lib/utils";

const links = [
  { to: "/student", icon: LayoutDashboard, label: "Home", end: true },
  { to: "/student/leaderboard", icon: Trophy, label: "Ranks", tour: "nav-leaderboard" },
  { to: "/student/notifications", icon: Bell, label: "Alerts" },
  { to: "/student/profile", icon: User, label: "Profile", tour: "nav-profile" },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 glass-strong border-t border-surface-border px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            data-tour={link.tour}
            className="relative flex flex-col items-center gap-0.5 py-2.5 px-3 flex-1 text-ink-faint"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute top-1 w-1.5 h-1.5 rounded-full bg-neon-blue shadow-glow"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <link.icon className={cn("w-5 h-5 transition-colors", isActive && "text-neon-blue")} />
                <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-ink" : "text-ink-faint")}>
                  {link.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
