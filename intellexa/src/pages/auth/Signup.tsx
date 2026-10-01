import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Hash, Lock, Mail, Phone, User } from "lucide-react";
import Button from "../../components/ui/Button";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../context/ToastContext";
import { authApi } from "../../lib/backend";
import { ApiError } from "../../lib/api";
import OtpVerification from "../../components/auth/OtpVerification";
import AvatarPicker from "../../components/auth/AvatarPicker";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";

const departments = ["Computer Science", "Information Technology", "Electronics", "AI & Data Science", "Mechanical", "Civil"];
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const languages = ["C++", "Python", "Java", "JavaScript", "Go", "Rust"];

export default function Signup() {
  const navigate = useNavigate();
  const { login, updateUser, completeProfile } = useApp();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: departments[0],
    year: years[0],
    registerNumber: "",
    phone: "",
    preferredLanguage: languages[0],
  });

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword: _confirmPassword, ...payload } = form;
      await authApi.register({
        ...payload,
        email: payload.email.trim().toLowerCase(),
        fullName: payload.fullName.trim(),
        registerNumber: payload.registerNumber.trim(),
        phone: payload.phone.trim(),
      });
      setVerificationPending(true);
      showToast("Verification code sent to your email.", "success");
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

  const verify = async (code: string) => {
    setLoading(true);
    try {
      const { user, token } = await authApi.verifyRegistration({ email: form.email.trim().toLowerCase(), code });
      login(user, token);
      if (avatarFile) {
        try {
          const { user: updatedUser } = await authApi.uploadAvatar(avatarFile);
          updateUser(updatedUser);
        } catch {
          showToast("Your account is ready, but the photo could not be uploaded. You can try again from Profile.", "error");
        }
      }
      completeProfile();
      showToast("Email verified. Welcome to Intellexa!", "success");
      navigate("/student");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Couldn't verify the code. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await authApi.resendRegistrationCode(form.email.trim().toLowerCase());
      showToast("A new verification code has been sent.", "success");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Couldn't resend the code. Please try again.", "error");
      throw error;
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setGoogleLoading(true);
    try {
      const { user, token } = await authApi.googleLogin(credential);
      login(user, token);
      showToast(`Welcome${user.role === "ADMIN" ? ", Admin" : ""}!`, "success");
      navigate(user.role === "ADMIN" ? "/admin" : "/student");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center relative overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-grid-glow" />
      <motion.div
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[8%] left-[6%] w-44 h-44 sm:w-64 sm:h-64 bg-neon-cyan/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 22, 0] }}
        transition={{ duration: 9, repeat: Infinity }}
        className="absolute bottom-[8%] right-[6%] w-48 h-48 sm:w-72 sm:h-72 bg-neon-purple/20 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl glass-strong rounded-2xl p-6 sm:p-8"
      >
        {verificationPending ? (
          <OtpVerification
            email={form.email.trim().toLowerCase()}
            onVerify={verify}
            onResend={resend}
            onBack={() => setVerificationPending(false)}
            busy={loading}
            title="Verify your email"
          />
        ) : <>
        <div className="mb-5 flex justify-center">
          <AvatarPicker size="signup" label="Add a profile photo" onSelect={setAvatarFile} />
        </div>
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-aurora flex items-center justify-center mb-4 shadow-glow">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-ink">Create your account</h1>
          <p className="text-ink-dim text-sm mt-1 text-center">
            Use your @rajalakshmi.edu.in email to join the Intellexa arena.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input
                required
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Full name"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm placeholder:text-ink-faint focus:border-neon-blue/50 outline-none transition-colors"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@rajalakshmi.edu.in"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm placeholder:text-ink-faint focus:border-neon-blue/50 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm placeholder:text-ink-faint focus:border-neon-blue/50 outline-none transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input
                type="password"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                placeholder="Confirm password"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm placeholder:text-ink-faint focus:border-neon-blue/50 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <select
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
            >
              {departments.map((department) => (
                <option key={department}>{department}</option>
              ))}
            </select>
            <select
              value={form.year}
              onChange={(e) => update("year", e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
            >
              {years.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input
                required
                value={form.registerNumber}
                onChange={(e) => update("registerNumber", e.target.value)}
                placeholder="Register number"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm placeholder:text-ink-faint focus:border-neon-blue/50 outline-none transition-colors"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="Phone"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm placeholder:text-ink-faint focus:border-neon-blue/50 outline-none transition-colors"
              />
            </div>
          </div>

          <select
            value={form.preferredLanguage}
            onChange={(e) => update("preferredLanguage", e.target.value)}
            className="w-full px-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
          >
            {languages.map((language) => (
              <option key={language}>{language}</option>
            ))}
          </select>

          <Button type="submit" fullWidth size="lg" disabled={loading} className="mt-2">
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-ink-faint" aria-hidden="true">
          <span className="h-px flex-1 bg-surface-border" />
          <span>or sign up with</span>
          <span className="h-px flex-1 bg-surface-border" />
        </div>
        <GoogleSignInButton onCredential={handleGoogleCredential} disabled={loading || googleLoading} />
        <p className="mt-2 text-center text-xs text-ink-faint">Only @rajalakshmi.edu.in Google Workspace accounts are allowed.</p>

        <p className="text-center text-sm text-ink-dim mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-neon-cyan hover:text-neon-blue transition-colors">
            Sign in
          </Link>
        </p>
        </>}
      </motion.div>
    </div>
  );
}
