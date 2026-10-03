import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";

import Splash from "./pages/Splash";
import Login from "./pages/auth/Login";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ProfileSetup from "./pages/auth/ProfileSetup";
import Tutorial from "./components/layout/Tutorial";

import StudentLayout from "./components/layout/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import QuizAttempt from "./pages/student/QuizAttempt";
import QuizResults from "./pages/student/QuizResults";
import Leaderboard from "./pages/student/Leaderboard";
import Profile from "./pages/student/Profile";
import Notifications from "./pages/student/Notifications";
import StudentSettings from "./pages/student/Settings";

import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateQuiz from "./pages/admin/CreateQuiz";
import Participants from "./pages/admin/Participants";
import AdminLeaderboard from "./pages/admin/AdminLeaderboard";
import Analytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/AdminSettings";

function RequireAuth({ children, role }: { children: React.ReactNode; role?: "admin" | "student" }) {
  const { isAuthenticated, isBootstrapping, user } = useApp();
  if (isBootstrapping) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  const currentRole = user.role === "ADMIN" ? "admin" : "student";
  if (role && currentRole !== role) return <Navigate to={currentRole === "admin" ? "/admin" : "/student"} replace />;
  return <>{children}</>;
}

function StudentGate({ children }: { children: React.ReactNode }) {
  const { hasCompletedProfile, hasSeenTutorial } = useApp();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (hasCompletedProfile && !hasSeenTutorial) {
      const t = setTimeout(() => setShowTutorial(true), 500);
      return () => clearTimeout(t);
    }
  }, [hasCompletedProfile, hasSeenTutorial]);

  if (!hasCompletedProfile) return <Navigate to="/onboarding/profile" replace />;

  return (
    <>
      {children}
      <AnimatePresence>{showTutorial && <TutorialGate onDone={() => setShowTutorial(false)} />}</AnimatePresence>
    </>
  );
}

function TutorialGate({ onDone }: { onDone: () => void }) {
  const { hasSeenTutorial } = useApp();
  if (hasSeenTutorial) {
    onDone();
    return null;
  }
  return <Tutorial />;
}

function RootRedirect() {
  const { isAuthenticated, isBootstrapping, hasSeenSplash, user } = useApp();
  if (isBootstrapping) return null;
  if (!hasSeenSplash) return <Navigate to="/splash" replace />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "ADMIN" ? "/admin" : "/student"} replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/splash" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route
        path="/onboarding/profile"
        element={
          <RequireAuth role="student">
            <ProfileSetup />
          </RequireAuth>
        }
      />

      <Route
        path="/student"
        element={
          <RequireAuth role="student">
            <StudentGate>
              <StudentLayout />
            </StudentGate>
          </RequireAuth>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="quiz/:id" element={<QuizAttempt />} />
        <Route path="quiz/:id/results" element={<QuizResults />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<StudentSettings />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth role="admin">
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="create-quiz" element={<CreateQuiz />} />
        <Route path="participants" element={<Participants />} />
        <Route path="leaderboard" element={<AdminLeaderboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <ToastProvider>
            <AnimatedRoutes />
          </ToastProvider>
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
