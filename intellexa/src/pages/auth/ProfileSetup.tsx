import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "../../components/pixel/PixelLucide";
import Button from "../../components/ui/Button";
import AvatarPicker from "../../components/auth/AvatarPicker";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../context/ToastContext";
import { ApiError } from "../../lib/api";
import { authApi } from "../../lib/backend";
import { parseCollegeEmail } from "../../lib/emailProfile";

const departments = ["Aeronautical Engineering","Automobile Engineering","Biomedical Engineering","Civil Engineering","Computer Science and Engineering","CSE(Cyber Security)","Computer Science and Design","Electrical and Electronics Engineering","Electronics and Communication Engineering","Mechanical Engineering","Mechatronics Engineering","Robotics and Automation","AI & Data Science","AI & Machine Learning","Biotechnoloy","Chemical Engineering","Computer Science and Business Systems","Food Technology","Information Technology"]
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const languages = ["C","C++", "Python", "Java", "JavaScript", "Go", "Rust"];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { completeProfile, updateUser, user } = useApp();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fromEmail = parseCollegeEmail(user?.email);
  const validDept = (d?: string) => (d && departments.includes(d) ? d : undefined);
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    department: validDept(fromEmail.department) ?? user?.department ?? departments[0],
    year: fromEmail.year ?? user?.year ?? years[0],
    registerNumber: user?.registerNumber ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    bio: user?.bio ?? "",
    preferredLanguage: user?.preferredLanguage ?? languages[0],
  });

  // fill department/year from the college email (the user can still change them)
  useEffect(() => {
    const detected = parseCollegeEmail(user?.email);
    const dept = validDept(detected.department);
    if (!dept && !detected.year) return;
    setForm((f) => ({ ...f, department: dept ?? f.department, year: detected.year ?? f.year }));
  }, [user?.email]);

  const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const uploadAvatar = async (file: File) => {
    setAvatarLoading(true);
    try {
      const { user: updatedUser } = await authApi.uploadAvatar(file);
      updateUser(updatedUser);
      showToast("Profile photo updated.", "success");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Couldn't upload the photo. Please try again.", "error");
      throw error;
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user: updatedUser } = await authApi.updateProfile({
        fullName: form.fullName.trim(),
        department: form.department,
        year: form.year,
        registerNumber: form.registerNumber.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim() || null,
        preferredLanguage: form.preferredLanguage,
      });
      updateUser(updatedUser);
      completeProfile();
      showToast("Profile saved. Welcome to Codexa!", "success");
      navigate("/student");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Couldn't save your profile. Please check your connection and try again.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-glow" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl glass-strong rounded-2xl p-6 sm:p-8"
      >
        <div className="mb-6">
          <span className="text-xs font-mono text-neon-cyan tracking-wider">STEP 1 OF 1</span>
          <h1 className="font-display font-bold text-2xl text-ink mt-1">Complete your profile</h1>
          <p className="text-ink-dim text-sm mt-1">This helps us personalize your competitive experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex min-w-0 items-center gap-4">
            <AvatarPicker value={user?.avatar} onSelect={uploadAvatar} label="Upload profile photo" size="setup" disabled={avatarLoading} />
            <div className="flex-1">
              <label className="text-xs text-ink-dim mb-1 block">Full name</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm placeholder:text-ink-faint focus:border-neon-blue/50 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-dim mb-1 block">Department</label>
              <select
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
              >
                {departments.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-dim mb-1 block">Year</label>
              <select
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
              >
                {years.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {(validDept(fromEmail.department) || fromEmail.year) && (
            <p className="-mt-2 text-[11px] text-ink-faint">Department and year were filled in from your college email. You can change them.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-ink-dim mb-1.5 block">Register number</label>
              <input
                required
                value={form.registerNumber}
                onChange={(e) => update("registerNumber", e.target.value)}
                placeholder="21CS1042"
                className="w-full px-4 py-3.5 rounded-xl bg-surface-light border-2 border-surface-border text-ink text-lg tracking-wide placeholder:text-ink-faint outline-none focus:border-neon-blue/60"
              />
            </div>
            <div>
              <label className="text-sm text-ink-dim mb-1.5 block">Phone</label>
              <input
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3.5 rounded-xl bg-surface-light border-2 border-surface-border text-ink text-lg tracking-wide placeholder:text-ink-faint outline-none focus:border-neon-blue/60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-dim mb-1 block">College email</label>
            <input
              disabled
              value={form.email}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-light/50 border border-surface-border text-ink-dim text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-ink-dim mb-1 block">Preferred language</label>
            <select
              value={form.preferredLanguage}
              onChange={(e) => update("preferredLanguage", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm outline-none focus:border-neon-blue/50"
            >
              {languages.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-ink-dim mb-1 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              placeholder="Tell the arena about yourself..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-light border border-surface-border text-ink text-sm placeholder:text-ink-faint outline-none focus:border-neon-blue/50 resize-none"
            />
          </div>

          <Button type="submit" fullWidth size="lg" className="mt-2" disabled={loading}>
            {loading ? "Saving profile..." : "Save and continue"} <ChevronRight className="w-4 h-4" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
