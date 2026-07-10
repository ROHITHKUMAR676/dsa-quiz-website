import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "../types";
import { currentUser } from "../data/mockData";

interface AppContextValue {
  isAuthenticated: boolean;
  role: Role;
  hasCompletedProfile: boolean;
  hasSeenSplash: boolean;
  hasSeenTutorial: boolean;
  login: (role: Role) => void;
  logout: () => void;
  completeProfile: () => void;
  markSplashSeen: () => void;
  finishTutorial: () => void;
  restartTutorial: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  const login = (r: Role) => {
    setRole(r);
    setIsAuthenticated(true);
  };
  const logout = () => {
    setIsAuthenticated(false);
    setHasCompletedProfile(false);
  };
  const completeProfile = () => setHasCompletedProfile(true);
  const markSplashSeen = () => setHasSeenSplash(true);
  const finishTutorial = () => setHasSeenTutorial(true);
  const restartTutorial = () => setHasSeenTutorial(false);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        role,
        hasCompletedProfile,
        hasSeenSplash,
        hasSeenTutorial,
        login,
        logout,
        completeProfile,
        markSplashSeen,
        finishTutorial,
        restartTutorial,
      }}
    >
      {currentUser && children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
