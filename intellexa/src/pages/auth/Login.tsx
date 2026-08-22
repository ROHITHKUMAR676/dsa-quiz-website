import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import Button from "../../components/ui/Button";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../context/ToastContext";
import { authApi } from "../../lib/backend";
import { ApiError } from "../../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user, token } = await authApi.login({ email, password });
      login(user, token);
      showToast(`Welcome back${user.role === "ADMIN" ? ", Admin" : ""}!`, "success");
      navigate(user.role === "ADMIN" ? "/admin" : "/student");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Couldn't reach the server. Please check your connection and try again.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
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
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-ink">Enter the Arena</h1>
          <p className="text-ink-dim text-sm mt-1 text-center">
            Sign in with your @rajalakshmi.edu.in email to compete, climb ranks, and level up.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              type="email"
              required
              placeholder="you@rajalakshmi.edu.in"
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
      </motion.div>
    </div>
  );
}
