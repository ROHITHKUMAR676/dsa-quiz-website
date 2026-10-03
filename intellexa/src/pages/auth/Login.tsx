import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../context/ToastContext";
import { authApi } from "../../lib/backend";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import BrandMark from "../../components/brand/BrandMark";
import PixelSprite from "../../components/pixel/PixelSprite";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const { showToast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleCredential = async (credential: string) => {
    setGoogleLoading(true);
    try {
      const { user, token } = await authApi.googleLogin(credential);
      login(user, token);
      showToast(`Welcome back${user.role === "ADMIN" ? ", Admin" : ""}!`, "success");
      navigate(user.role === "ADMIN" ? "/admin" : "/student");
    } finally {
      setGoogleLoading(false);
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

      <div className="absolute left-[6%] top-[22%] hidden lg:block opacity-45"><PixelSprite kind="tree" size={5} bob /></div>
      <div className="absolute right-[7%] top-[18%] hidden lg:block opacity-45"><PixelSprite kind="stack" size={5} bob /></div>
      <div className="absolute left-[9%] bottom-[14%] hidden lg:block opacity-45"><PixelSprite kind="list" size={4} bob /></div>
      <div className="absolute right-[9%] bottom-[16%] hidden lg:block opacity-45"><PixelSprite kind="graph" size={5} bob /></div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md glass-strong rounded-2xl p-6 sm:p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <BrandMark className="mb-5 w-52 max-w-full" />
          <h1 className="font-display font-bold text-2xl text-ink">Enter the Arena</h1>
          <p className="text-ink-dim text-sm mt-1 text-center">
            Continue with your Rajalakshmi Engineering College Google account to compete, climb ranks, and level up.
          </p>
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} disabled={googleLoading} />
        <p className="mt-3 text-center text-xs text-ink-faint">Only verified @rajalakshmi.edu.in Google Workspace accounts are allowed.</p>
        <p className="text-center text-xs text-ink-faint mt-4">
          By using Intellexa, you agree to our{" "}
          <Link to="/privacy" className="text-neon-cyan hover:text-neon-blue transition-colors">
            Privacy Policy
          </Link>.
        </p>
      </motion.div>
    </div>
  );
}
