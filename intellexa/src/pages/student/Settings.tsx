import { Settings as SettingsIcon, RotateCcw, Volume2, Moon, LogOut, Palette } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { ThemeSwatch } from "../../components/ui/ThemeSwatch";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-aurora" : "bg-surface-border"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { restartTutorial, logout } = useApp();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [sound, setSound] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-neon-blue" /> Settings
        </h1>
        <p className="text-ink-dim text-sm">Manage your experience preferences.</p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Palette className="w-4.5 h-4.5 text-ink-dim" />
          <div>
            <p className="text-sm text-ink font-medium">Theme</p>
            <p className="text-xs text-ink-faint">Switch between Nebula and White Smokey</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ThemeSwatch
            active={theme === "dark"}
            label="Nebula"
            sublabel="Current dark design"
            previewBg="linear-gradient(135deg, #161925, #1E2334)"
            previewAccent="#568CB3"
            onClick={() => setTheme("dark")}
          />
          <ThemeSwatch
            active={theme === "light"}
            label="White Smokey"
            sublabel="Clean bright system"
            previewBg="linear-gradient(135deg, #FFFFFF, #EAF0F7)"
            previewAccent="#0656a4"
            onClick={() => setTheme("light")}
          />
        </div>
      </Card>

      <Card className="p-5 space-y-5">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Volume2 className="w-4.5 h-4.5 text-ink-dim" />
            <div className="min-w-0">
              <p className="text-sm text-ink font-medium">Sound effects</p>
              <p className="text-xs text-ink-faint">Correct answers, level ups, badges</p>
            </div>
          </div>
          <Toggle checked={sound} onChange={setSound} label="Sound effects" />
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Moon className="w-4.5 h-4.5 text-ink-dim" />
            <div className="min-w-0">
              <p className="text-sm text-ink font-medium">Reduced motion</p>
              <p className="text-xs text-ink-faint">Minimize animations across the app</p>
            </div>
          </div>
          <Toggle checked={reducedMotion} onChange={setReducedMotion} label="Reduced motion" />
        </div>
      </Card>

      <Card className="p-5 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <RotateCcw className="w-4.5 h-4.5 text-ink-dim" />
          <div className="min-w-0">
            <p className="text-sm text-ink font-medium">Show Tutorial Again</p>
            <p className="text-xs text-ink-faint">Replay the onboarding walkthrough</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={() => {
            restartTutorial();
            navigate("/student");
            showToast("Starting the walkthrough", "info");
          }}
        >
          Replay
        </Button>
      </Card>

      <Button variant="danger" fullWidth onClick={logout}>
        <LogOut className="w-4 h-4" /> Log out
      </Button>
    </div>
  );
}
