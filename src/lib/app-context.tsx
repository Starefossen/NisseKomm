"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { StorageManager } from "./storage";
import { GameEngine } from "./game-engine";
import { getCurrentDay } from "./date-utils";
import { getSessionId, clearSessionId } from "./auth-cookies";
import { CalendarEvent } from "@/types/innhold";
import { lastFamilie } from "./navn";

/**
 * Application State Context
 *
 * Centralized state management for the entire NisseKomm application.
 * Handles:
 * - Session authentication and restoration
 * - Family data loading (calendar events, settings)
 * - Game state initialization
 * - Provides unified access to all application data
 *
 * DESIGN PRINCIPLES:
 * 1. Single initialization point - All data loaded once on auth
 * 2. Components access data through context, not direct fetches
 * 3. GameEngine remains the facade for game logic operations
 * 4. Family data is loaded separately from game state (different sources)
 */

// ============================================================================
// Types
// ============================================================================

interface FamilyData {
  calendarEvents: CalendarEvent[];
}

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  isInitializing: boolean;
  sessionId: string | null;

  familyData: FamilyData;

  // Derived game state accessors (computed from GameEngine)
  unlockedModules: string[];
  unreadEmailCount: number;
  unreadFileCount: number;
  unreadDagbokCount: number;

  // Actions
  authenticate: (sessionId: string) => Promise<void>;
  logout: () => void;
  refreshGameState: () => void;
}

// ponytail: no family data source until the server state lands (T5/T6)
const familyData: FamilyData = { calendarEvents: [] };

const AppContext = createContext<AppState | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Core state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionId, setSessionIdState] = useState<string | null>(null);

  // Game state (refreshed on demand)
  const [unlockedModules, setUnlockedModules] = useState<string[]>([]);
  const [unreadEmailCount, setUnreadEmailCount] = useState(0);
  const [unreadFileCount, setUnreadFileCount] = useState(0);
  const [unreadDagbokCount, setUnreadDagbokCount] = useState(0);

  /**
   * Refresh game state from GameEngine
   * Called after code submissions, window closes, etc.
   */
  const refreshGameState = useCallback(() => {
    if (typeof window === "undefined") return;

    GameEngine.awardDueBadges();
    setUnlockedModules(GameEngine.getUnlockedModules());

    const currentDay = getCurrentDay();
    setUnreadEmailCount(GameEngine.getUnreadEmailCount(currentDay));
    setUnreadFileCount(GameEngine.getUnreadFileCount());

    setUnreadDagbokCount(GameEngine.isJuliusVideoWatched(currentDay) ? 0 : 1);
  }, []);

  /**
   * Full initialization sequence
   * Called on session restore and after successful authentication
   */
  const initializeApp = useCallback(
    async (newSessionId: string) => {
      console.debug(
        "[AppContext] Initializing app for session:",
        newSessionId.substring(0, 8) + "...",
      );

      await StorageManager.setAuthenticated(true);
      // Shared state and the family's names before the first render of game
      // state: nothing that shows or compares a name runs without them.
      await Promise.all([StorageManager.sync(refreshGameState), lastFamilie()]);

      // Refresh game state
      refreshGameState();

      console.debug("[AppContext] Initialization complete");
    },
    [refreshGameState],
  );

  /**
   * Authenticate with a new session
   * Called from PasswordPrompt on successful login
   */
  const authenticate = useCallback(
    async (newSessionId: string) => {
      setSessionIdState(newSessionId);
      setIsInitializing(true);
      setIsAuthenticated(true);
      await initializeApp(newSessionId);
      setIsInitializing(false);
    },
    [initializeApp],
  );

  const logout = useCallback(() => {
    clearSessionId();
    StorageManager.clearAll();
    setSessionIdState(null);
    setIsAuthenticated(false);
    refreshGameState();
  }, [refreshGameState]);

  /**
   * Restore existing session on mount
   */
  useEffect(() => {
    const restoreSession = async () => {
      const existingSessionId = getSessionId();

      if (existingSessionId) {
        console.debug(
          "[AppContext] Restoring session:",
          existingSessionId.substring(0, 8) + "...",
        );

        setSessionIdState(existingSessionId);
        await initializeApp(existingSessionId);
        setIsAuthenticated(true);

        console.debug("[AppContext] Session restored successfully");
      } else if (StorageManager.isAuthenticated()) {
        await Promise.all([
          StorageManager.sync(refreshGameState),
          lastFamilie(),
        ]);
        setIsAuthenticated(true);
        refreshGameState();
      }

      setIsInitializing(false);
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const value: AppState = {
    isAuthenticated,
    isInitializing,
    sessionId,
    familyData,
    unlockedModules,
    unreadEmailCount,
    unreadFileCount,
    unreadDagbokCount,
    authenticate,
    logout,
    refreshGameState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Access application state from any component
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { familyData, refreshGameState } = useAppState();
 *   // Access calendar events
 *   const events = familyData.calendarEvents;
 * }
 * ```
 */
export function useAppState(): AppState {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppState must be used within an AppProvider");
  }

  return context;
}
