import { Settings as SettingsIcon, LogOut } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useApp } from "../../context/AppContext";

function Toggle({ checked }: { checked: boolean }) {
  return (
    <div className={`w-11 h-6 rounded-full relative shrink-0 ${checked ? "bg-aurora" : "bg-surface-border"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </div>
  );
}

export default function AdminSettings() {
  const { logout } = useApp();
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-neon-blue" /> Settings
        </h1>
        <p className="text-ink-dim text-sm">Platform configuration.</p>
      </div>
      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink font-medium">Anti-cheat detection</p>
            <p className="text-xs text-ink-faint">Deduct points on tab switch during a live quiz</p>
          </div>
          <Toggle checked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink font-medium">Auto-publish scheduled quizzes</p>
            <p className="text-xs text-ink-faint">Release quizzes automatically at scheduled time</p>
          </div>
          <Toggle checked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink font-medium">Email notifications</p>
            <p className="text-xs text-ink-faint">Notify admins of new registrations</p>
          </div>
          <Toggle checked={false} />
        </div>
      </Card>
      <Button variant="danger" onClick={logout}>
        <LogOut className="w-4 h-4" /> Log out
      </Button>
    </div>
  );
}
