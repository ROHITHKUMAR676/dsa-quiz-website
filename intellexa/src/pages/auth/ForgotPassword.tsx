import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import Button from "../../components/ui/Button";
import OtpVerification from "../../components/auth/OtpVerification";
import { authApi } from "../../lib/backend";
import { ApiError } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

type Step = "email" | "code" | "password";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await authApi.forgotPassword(normalizedEmail);
      setEmail(normalizedEmail);
      setStep("code");
      showToast("If an account exists for this email, a verification code has been sent.", "success");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Couldn't send the code. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code: string) => {
    setLoading(true);
    try {
      const result = await authApi.verifyResetCode({ email, code });
      setResetToken(result.resetToken);
      setStep("password");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Couldn't verify the code. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await authApi.resendResetCode(email);
      showToast("If an account exists for this email, a new code has been sent.", "success");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Couldn't resend the code. Please try again.", "error");
      throw error;
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token: resetToken, password });
      showToast("Password updated. Sign in with your new password.", "success");
      navigate("/login", { replace: true });
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Couldn't update the password. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center relative overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-grid-glow" />
      <section className="relative z-10 w-full max-w-md glass-strong rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-aurora flex items-center justify-center mb-4 shadow-glow">
            {step === "password" ? <Lock className="w-7 h-7 text-white" /> : <Mail className="w-7 h-7 text-white" />}
          </div>
          {step === "email" && <>
            <h1 className="font-display font-bold text-2xl text-ink">Reset your password</h1>
            <p className="text-ink-dim text-sm mt-2 text-center">Enter your account email and we’ll send a verification code.</p>
          </>}
          {step === "password" && <>
            <h1 className="font-display font-bold text-2xl text-ink">Create a new password</h1>
            <p className="text-ink-dim text-sm mt-2 text-center">Choose a password with at least 8 characters.</p>
          </>}
        </div>

        {step === "email" && <form onSubmit={sendCode} className="space-y-4">
          <label className="block text-sm text-ink-dim" htmlFor="recovery-email">Email address</label>
          <input id="recovery-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@rajalakshmi.edu.in" className="w-full px-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50" />
          <Button type="submit" fullWidth size="lg" disabled={loading}>{loading ? "Sending..." : "Send verification code"}</Button>
        </form>}

        {step === "code" && <OtpVerification email={email} onVerify={verify} onResend={resend} onBack={() => setStep("email")} busy={loading} title="Verify your code" />}

        {step === "password" && <form onSubmit={updatePassword} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm text-ink-dim mb-2">New password</label>
            <input id="new-password" type={showPassword ? "text" : "password"} required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full px-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50" />
          </div>
          <div>
            <label htmlFor="confirm-new-password" className="block text-sm text-ink-dim mb-2">Confirm new password</label>
            <input id="confirm-new-password" type={showPassword ? "text" : "password"} required minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full px-3 py-3 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-dim"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Show passwords</label>
          <Button type="submit" fullWidth size="lg" disabled={loading}>{loading ? "Updating..." : "Reset password"}</Button>
        </form>}

        <p className="text-center text-sm text-ink-dim mt-6"><Link to="/login" className="text-neon-cyan hover:text-neon-blue">Back to Login</Link></p>
      </section>
    </main>
  );
}
