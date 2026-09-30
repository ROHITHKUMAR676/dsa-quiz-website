import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";

interface OtpVerificationProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  busy: boolean;
  title?: string;
  deliveryMessage?: string;
}

export default function OtpVerification({ email, onVerify, onResend, onBack, busy, title = "Verify your email", deliveryMessage }: OtpVerificationProps) {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [seconds, setSeconds] = useState(60);
  const [resending, setResending] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const changeDigit = (index: number, raw: string) => {
    const nextChar = raw.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((digit, i) => (i === index ? nextChar : digit)));
    if (nextChar && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, index) => pasted[index] ?? ""));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const resend = async () => {
    setResending(true);
    try {
      await onResend();
      setDigits(Array(6).fill(""));
      setSeconds(60);
      refs.current[0]?.focus();
    } catch {
      // The parent reports delivery and cooldown errors through the app toast.
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={(event) => { event.preventDefault(); void onVerify(digits.join("")); }} className="space-y-5">
      <div className="text-center">
        <h1 className="font-display font-bold text-2xl text-ink">{title}</h1>
        <p className="text-ink-dim text-sm mt-2">{deliveryMessage ?? <>Enter the 6-digit code sent to <span className="text-ink">{email}</span></>}</p>
      </div>
      <div className="flex justify-center gap-2 sm:gap-3" aria-label="6-digit verification code">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => { refs.current[index] = element; }}
            aria-label={`Verification digit ${index + 1}`}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(event) => changeDigit(index, event.target.value)}
            onPaste={handlePaste}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
              if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
              if (event.key === "ArrowRight" && index < 5) refs.current[index + 1]?.focus();
            }}
            className="w-10 h-12 sm:w-12 sm:h-14 rounded-lg bg-surface-light border border-surface-border text-center text-xl font-semibold text-ink outline-none focus:border-neon-cyan"
          />
        ))}
      </div>
      <Button type="submit" fullWidth size="lg" disabled={busy || digits.join("").length !== 6}>{busy ? "Verifying..." : "Verify code"}</Button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-ink-dim hover:text-ink">Back</button>
        <button type="button" disabled={seconds > 0 || resending || busy} onClick={() => void resend()} className="text-neon-cyan disabled:text-ink-faint">
          {resending ? "Sending..." : seconds > 0 ? `Resend code in ${seconds}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
