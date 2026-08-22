import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "../types";
import { authApi, type BackendUser } from "../lib/backend";
import { getToken, setToken } from "../lib/api";

const TUTORIAL_STORAGE_KEY = "intellexa:hasSeenTutorial";

function readTutorialSeen(): boolean {
  try {
    return window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
  } catch {
    // localStorage can throw in private-browsing/blocked-storage contexts -
    // fail safe by treating the tutorial as unseen rather than crashing.
    return false;
  }
}

function writeTutorialSeen(seen: boolean) {
  try {
    if (seen) window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    else window.localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  } catch {
    // Ignore - worst case the tutorial reappears once more than intended.
  }
}

function toRole(backendRole: BackendUser["role"]): Role {
  return backendRole === "ADMIN" ? "admin" : "student";
}

function hasRequiredStudentProfile(user: BackendUser) {
  if (user.role === "ADMIN") return true;
  return Boolean(user.fullName && user.department && user.year && user.registerNumber && user.phone);
}

interface AppContextValue {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  role: Role;
  user: BackendUser | null;
  hasCompletedProfile: boolean;
  hasSeenSplash: boolean;
  hasSeenTutorial: boolean;
  /** Called after a successful /auth/login or /auth/register response. */
  login: (user: BackendUser, token: string) => void;
  updateUser: (user: BackendUser) => void;
  logout: () => void;
  completeProfile: () => void;
  markSplashSeen: () => void;
  finishTutorial: () => void;
  restartTutorial: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [role, setRole] = useState<Role>("student");
  const [user, setUser] = useState<BackendUser | null>(null);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(readTutorialSeen);

  // Restore a session from a previously-stored JWT (e.g. after a page
  // reload). The token is only ever trusted after the backend confirms it
  // via /auth/me - never decoded/trusted client-side.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsBootstrapping(false);
      return;
    }
    authApi
      .me()
      .then(({ user: me }) => {
        setUser(me);
        setRole(toRole(me.role));
        setIsAuthenticated(true);
        setHasCompletedProfile(hasRequiredStudentProfile(me));
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => setIsBootstrapping(false));
  }, []);

  const login = (backendUser: BackendUser, token: string) => {
    setToken(token);
    setUser(backendUser);
    setRole(toRole(backendUser.role));
    setIsAuthenticated(true);
    setHasCompletedProfile(hasRequiredStudentProfile(backendUser));
  };
  const updateUser = (backendUser: BackendUser) => {
    setUser(backendUser);
    setRole(toRole(backendUser.role));
    setHasCompletedProfile(hasRequiredStudentProfile(backendUser));
  };
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setHasCompletedProfile(false);
  };
  const completeProfile = () => setHasCompletedProfile(true);
  const markSplashSeen = () => setHasSeenSplash(true);
  // Persisted (spec section 26: must NOT reappear on every visit). This is
  // a client-side fallback until the profile-update endpoint on the
  // backend exposes UserSettings.tutorialCompleted as the durable,
  // per-account source of truth.
  const finishTutorial = () => {
    setHasSeenTutorial(true);
    writeTutorialSeen(true);
  };
  const restartTutorial = () => {
    setHasSeenTutorial(false);
    writeTutorialSeen(false);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isBootstrapping,
        role,
        user,
        hasCompletedProfile,
        hasSeenSplash,
        hasSeenTutorial,
        login,
        updateUser,
        logout,
        completeProfile,
        markSplashSeen,
        finishTutorial,
        restartTutorial,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
