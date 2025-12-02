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
import { getSessionId, setSessionId } from "./session-manager";
import { CalendarEvent } from "@/types/innhold";

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
  familyName?: string;
  kidNames: string[];
  friendNames: string[];
}

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  isInitializing: boolean;
  sessionId: string | null;

  // Family data (from Sanity/API)
  familyData: FamilyData;

  // Derived game state accessors (computed from GameEngine)
  unlockedModules: string[];
  unreadEmailCount: number;
  unreadFileCount: number;
  unreadDagbokCount: number;

  // Actions
  authenticate: (sessionId: string) => Promise<void>;
  refreshGameState: () => void;
  refreshFamilyData: () => Promise<void>;
}

const defaultFamilyData: FamilyData = {
  calendarEvents: [],
  familyName: undefined,
  kidNames: [],
  friendNames: [],
};

const AppContext = createContext<AppState | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Core state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return StorageManager.isAuthenticated();
    }
    return false;
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionId, setSessionIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return getSessionId();
    }
    return null;
  });

  // Family data
  const [familyData, setFamilyData] = useState<FamilyData>(defaultFamilyData);

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

    setUnlockedModules(GameEngine.getUnlockedModules());

    // Import getCurrentDay to avoid circular dependency
    import("./date-utils").then(({ getCurrentDay }) => {
      const currentDay = getCurrentDay();
      setUnreadEmailCount(GameEngine.getUnreadEmailCount(currentDay));
      setUnreadFileCount(GameEngine.getUnreadFileCount());

      const completedQuests = GameEngine.loadGameState().completedQuests;
      setUnreadDagbokCount(
        StorageManager.getUnreadDagbokCount(completedQuests),
      );
    });
  }, []);

  /**
   * Fetch family data from API
   * Loads all non-sensitive family data: names, calendar events, etc.
   */
  const fetchFamilyData = useCallback(async (): Promise<FamilyData> => {
    try {
      const response = await fetch("/api/family", {
        credentials: "include",
      });

      if (response.ok) {
        const data = (await response.json()) as FamilyData;
        return {
          familyName: data.familyName,
          kidNames: data.kidNames || [],
          friendNames: data.friendNames || [],
          calendarEvents: data.calendarEvents || [],
        };
      }
    } catch (err) {
      console.warn("Could not fetch family data:", err);
    }

    return defaultFamilyData;
  }, []);

  /**
   * Refresh family data (for when settings change)
   */
  const refreshFamilyData = useCallback(async () => {
    const data = await fetchFamilyData();
    setFamilyData(data);
  }, [fetchFamilyData]);

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

      // Wait for storage adapter initialization
      await StorageManager.setAuthenticated(true, newSessionId);

      // Load family data
      const data = await fetchFamilyData();
      setFamilyData(data);

      // Refresh game state
      refreshGameState();

      console.debug("[AppContext] Initialization complete");
    },
    [fetchFamilyData, refreshGameState],
  );

  /**
   * Authenticate with a new session
   * Called from PasswordPrompt on successful login
   */
  const authenticate = useCallback(
    async (newSessionId: string) => {
      setSessionId(newSessionId);
      setSessionIdState(newSessionId);
      setIsAuthenticated(true);
      await initializeApp(newSessionId);
    },
    [initializeApp],
  );

  /**
   * Restore existing session on mount
   */
  useEffect(() => {
    const restoreSession = async () => {
      const existingSessionId = getSessionId();

      if (existingSessionId && !isAuthenticated) {
        console.debug(
          "[AppContext] Restoring session:",
          existingSessionId.substring(0, 8) + "...",
        );

        setSessionIdState(existingSessionId);
        await initializeApp(existingSessionId);
        setIsAuthenticated(true);

        console.debug("[AppContext] Session restored successfully");
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
    refreshGameState,
    refreshFamilyData,
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
