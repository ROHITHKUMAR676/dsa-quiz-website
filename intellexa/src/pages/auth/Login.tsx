import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Zap, ShieldCheck } from "lucide-react";
import Button from "../../components/ui/Button";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../context/ToastContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (role: "student" | "admin") => {
    setLoading(true);
    setTimeout(() => {
      login(role);
      showToast(`Welcome back${role === "admin" ? ", Admin" : ""}!`, "success");
      navigate(role === "admin" ? "/admin" : "/onboarding/profile");
      setLoading(false);
    }, 700);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center relative overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-grid-glow" />
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[10%] left-[8%] w-40 h-40 sm:w-64 sm:h-64 bg-neon-blue/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 24, 0] }}
        transition={{ duration: 9, repeat: Infinity }}
        className="absolute bottom-[10%] right-[8%] w-48 h-48 sm:w-72 sm:h-72 bg-neon-purple/20 rounded-full blur-3xl"
      />
      {/* floating shapes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-lg border border-neon-blue/20 hidden sm:block"
          style={{
            width: 20 + i * 6,
            height: 20 + i * 6,
            left: `${10 + i * 15}%`,
            top: `${15 + (i % 3) * 25}%`,
          }}
          animate={{ y: [0, -15, 0], rotate: [0, 90, 0] }}
          transition={{ duration: 6 + i, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md glass-strong rounded-2xl p-6 sm:p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-aurora flex items-center justify-center mb-4 shadow-glow">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-ink">Enter the Arena</h1>
          <p className="text-ink-dim text-sm mt-1 text-center">Sign in to compete, climb ranks, and level up.</p>
        </div>

        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={() => handleLogin("student")}
          disabled={loading}
          className="mb-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-surface-border flex-1" />
          <span className="text-ink-faint text-xs">or use college email</span>
          <div className="h-px bg-surface-border flex-1" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin("student");
          }}
          className="space-y-3"
        >
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              type="email"
              required
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm placeholder:text-ink-faint focus:border-neon-blue/50 outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm placeholder:text-ink-faint focus:border-neon-blue/50 outline-none transition-colors"
            />
          </div>
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <button
          onClick={() => handleLogin("admin")}
          className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-faint hover:text-neon-cyan transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Continue as Admin (demo)
        </button>
      </motion.div>
    </div>
  );
}
