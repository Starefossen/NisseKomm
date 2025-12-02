# NisseKomm - System Architecture

> Technical architecture patterns, state management, and system design decisions.

## Table of Contents

- [Layout & Component Hierarchy](#layout--component-hierarchy)
- [Application Modules](#application-modules)
- [State Management](#state-management)
- [Architecture Principles (Facade Pattern)](#architecture-principles-facade-pattern)
- [Data Architecture](#data-architecture)
- [Date Handling System](#date-handling-system)

## Layout & Component Hierarchy

### CRT Frame Structure

```text
┌─ CRT Frame (fullscreen) ───────────────┐
│ ┌─ Sidebar (25%) ─┬─ Main (75%) ─────┐ │
│ │ System Status   │ Desktop Icons    │ │
│ │ Alert Feed      │ or Active Window │ │
│ └─────────────────┴──────────────────┘ │
└─────────────────────────────────────────┘
```

### Key Concepts

- **Single window paradigm**: Only one app window open at a time (desktop icons hide when window opens)
- **Persistent sidebar**: Always shows system metrics and scrolling alerts
- **Modal windows**: Centered overlays with retro window chrome
- **Desktop grid**: 2×3 icon layout (6 core modules + 4 unlockable modules)

### Component Hierarchy

```
CRTFrame (fullscreen container)
├── Sidebar (25% width)
│   ├── SystemStatus (metrics widget)
│   └── VarselKonsoll (scrolling alerts)
└── Main (75% width)
    ├── DesktopGrid (icon layout)
    │   ├── Core Icons (6 always visible)
    │   └── Unlockable Icons (4 conditional)
    └── ActiveWindow (single window at a time)
        ├── RetroWindow (chrome wrapper)
        └── Module Component (content)
```

## Application Modules

### Core Desktop Modules (Always Available)

1. **NisseMail** (`windows/NisseMail.tsx`)
   - Email inbox showing daily missions from Rampenissen
   - Unread badge on desktop icon
   - Split-view: 30% inbox | 70% content
   - Read tracking per email

2. **KodeTerminal** (`windows/KodeTerminal.tsx`)
   - Code submission interface
   - Validation with 1.5s processing delay
   - History of submitted codes
   - Parent validation checkbox for bonusoppdrag

3. **NisseNet Utforsker** (`windows/NisseNetUtforsker.tsx`)
   - File browser with folder tree navigation
   - Hint files and flavor text
   - Dynamic Nice List injection (Days 22-24)
   - Unread file indicators

4. **Kalender** (`windows/Kalender.tsx`)
   - 24-day grid (December 1-24)
   - Day states: locked/available/completed
   - Modal with mission preview
   - Direct integration with NisseMail

5. **EventyrOversikt** (`windows/EventyrOversikt.tsx`)
   - Story arc visualization
   - Progress tracking for 2 eventyr
   - Phase-by-phase breakdown
   - Unlocks: Day 8

6. **Julius' Dagbok** (`windows/Dagbok.tsx`)
   - Continuous scroll timeline
   - Quest-gated entries (prevents spoilers)
   - Unread tracking with auto-scroll
   - IntersectionObserver for read detection

### Unlockable Modules (Conditional Appearance)

1. **NISSEKRYPTO** (`windows/NisseKrypto.tsx`)
   - **Unlocks**: Day 4 completion
   - Decryption challenges (3 progressive puzzles)
   - Drag-drop symbol interface
   - Attempt tracking and hints

2. **SYMBOLSKANNER** (`windows/SymbolScanner.tsx`)
   - **Unlocks**: Day 4 completion
   - QR code scanner for symbol cards
   - Manual code entry fallback
   - Camera management with proper cleanup

3. **NISSEMUSIKK** (`windows/NisseMusikk.tsx`)
   - **Unlocks**: Day 6 completion
   - Christmas music player (Snøfall Radio)
   - Background audio control

4. **BREVFUGLER** (`windows/Brevfugler.tsx`)
   - **Unlocks**: Day 14 completion
   - Personal letters from Julius
   - Origami-style paper birds

### Module Unlock Logic

Unlocks are configured in quest JSON files (`uke1-4_oppdrag.json`):

```json
{
  "dag": 4,
  "reveals": {
    "modules": ["NISSEKRYPTO", "SYMBOLSKANNER"]
  }
}
```

GameEngine dynamically determines available modules:

```typescript
static getUnlockedModules(): string[] {
  const completedDays = this.getCompletedDays();
  const allQuests = getAllQuests();

  const modules = new Set<string>();
  allQuests.forEach(quest => {
    if (completedDays.has(quest.dag) && quest.reveals?.modules) {
      quest.reveals.modules.forEach(m => modules.add(m));
    }
  });

  return Array.from(modules);
}
```

## State Management

### StorageManager Pattern

**Purpose**: Centralized localStorage abstraction with type-safe methods.

**Location**: `lib/storage.ts`

**Key Methods**:

```typescript
// Game State (via GameEngine only)
static getCompletedDaysForMissions(): Set<number>
static addSubmittedCode(day: number, code: string, timestamp: string)
static getCollectedSymbols(): DecryptionSymbol[]
static addCollectedSymbol(symbol: DecryptionSymbol)

// UI State (direct access allowed)
static isAuthenticated(): boolean
static setAuthenticated(value: boolean)
static getPlayerNames(): string[]
static addPlayerName(name: string)
static getDagbokLastRead(): number
static setDagbokLastRead(day: number)
```

### React State Patterns

**Component State Strategy** (in `page.tsx` and windows):

```typescript
// ✅ GOOD - Lazy initialization with StorageManager
const [isAuthenticated, setIsAuthenticated] = useState(() =>
  StorageManager.isAuthenticated(),
);

// ✅ GOOD - Sync both StorageManager and local state
const handleLogin = (password: string) => {
  if (validatePassword(password)) {
    StorageManager.setAuthenticated(true);
    setIsAuthenticated(true);
  }
};

// ❌ BAD - Loading state before lazy init
const [isAuthenticated, setIsAuthenticated] = useState(false);
useEffect(() => {
  setIsAuthenticated(StorageManager.isAuthenticated()); // Flash!
}, []);
```

**State Types**:

- **Persistent** (localStorage via StorageManager): Authentication, progress, read status, preferences
- **Session-only** (React state): Open window, selected day, UI interactions
- **Derived** (computed): Unlocked modules, available quests, eventyr progress

## Architecture Principles (Facade Pattern)

### Critical Design Pattern

The codebase follows a strict **Facade Pattern** with clear boundaries between UI, game logic, domain systems, and persistence layers.

### Layer Responsibilities

1. **GameEngine** (`lib/game-engine.ts`) - **Single Entry Point**
   - Central orchestration layer for ALL game state operations
   - UI components MUST call GameEngine methods, NEVER StorageManager directly
   - Provides type-safe accessor methods for reading game state
   - Delegates to specialized domain systems for cohesive features
   - Examples: `submitCode()`, `getCompletedDays()`, `getSolvedDecryptions()`

2. **Domain Systems** (`lib/systems/`, `lib/generators/`, `lib/validators/`)
   - Specialized modules for cohesive features
   - Self-contained logic with clear responsibilities
   - Can be imported directly by GameEngine or UI when appropriate
   - Examples:
     - `symbol-system.ts` - Symbol collection and validation
     - `alert-generator.ts` - Dynamic alert creation
     - `quest-validator.ts` - Quest data validation
     - `badge-system.ts` - Achievement tracking

3. **Data Loader** (`lib/data-loader.ts`) - **Content Abstraction**
   - Centralized loading and validation of quest data from JSON files
   - Build-time validation ensures data integrity before app runs
   - Provides clean API: `getAllQuests()`, `getQuestByDay(day)`
   - Separates data concerns from game logic
   - GameEngine imports from data-loader instead of directly loading JSON

4. **StorageManager** (`lib/storage.ts`) - **Internal Use Only**
   - Direct access from UI components is PROHIBITED for game state
   - Only GameEngine and domain systems should call StorageManager
   - Type-safe localStorage abstraction
   - Easy to swap for backend API in future

5. **UI Components** (`src/components/`, `src/app/`)
   - Call GameEngine methods for game state operations
   - Import domain systems directly only for pure utilities
   - May access StorageManager ONLY for pure UI state

### Acceptable StorageManager Direct Access

UI components may call StorageManager directly for **non-game state** concerns:

- **Authentication**: `isAuthenticated()`, `setAuthenticated(value, sessionId)` - Session management
- **Friend Names**: `getFriendNames()`, `setFriendNames()` - Nice List personalization (async)
- **Player Names**: `getPlayerNames()`, `setPlayerNames()` - Day 23 finale names
- **Diary Tracking**: `getDagbokLastRead()`, `setDagbokLastRead()` - Scroll position memory
- **Visit Tracking**: `setNisseNetLastVisit()`, `hasUnreadNiceList()` - UI badge state
- **Admin Tools**: `clearAll()`, `addEarnedBadge()`, `removeEarnedBadge()` - Parent guide only

### Code Examples

```typescript
// ❌ BAD - UI directly accessing game state
const completedDays = StorageManager.getCompletedDaysForMissions();
const codes = StorageManager.getSubmittedCodes();
const symbols = StorageManager.getCollectedSymbols();

// ✅ GOOD - UI calls GameEngine facade
const completedDays = GameEngine.getCompletedDays();
const codes = GameEngine.getSubmittedCodes();
const symbols = GameEngine.getCollectedSymbols();

// ✅ ACCEPTABLE - Pure UI state
const isLoggedIn = StorageManager.isAuthenticated();
const lastRead = StorageManager.getDagbokLastRead();
const playerNames = StorageManager.getPlayerNames();
```

### Why This Pattern?

- **Encapsulation**: Game logic centralized, easier to test and maintain
- **Type Safety**: GameEngine provides properly typed interfaces
- **Flexibility**: Can add caching, validation, or backend without changing UI
- **Clarity**: Clear ownership - UI asks GameEngine "what should I show?"
- **Testing**: Mock GameEngine instead of StorageManager for unit tests

## Data Architecture

### Content Files

**Quest Data** (in `src/data/`):

- `uke1_oppdrag.json` - Days 1-6 (Week 1)
- `uke2_oppdrag.json` - Days 7-12 (Week 2)
- `uke3_oppdrag.json` - Days 13-18 (Week 3)
- `uke4_oppdrag.json` - Days 19-24 (Week 4)
- `statisk_innhold.json` - File system, alerts, system metrics
- `eventyr.json` - Story arc definitions (2 eventyr)
- `merker.json` - Badge/achievement definitions

### Data Loader (`lib/data-loader.ts`)

**Purpose**: Centralized quest data loading and validation (separates data from game logic).

**Build-time Validation**:

- Quest structure integrity
- File references exist
- Topic dependencies resolved
- Eventyr references valid
- Symbol references complete
- Progressive hints structure

**Public API**:

```typescript
// Get all 24 quests (sorted by day)
const allQuests = getAllQuests();

// Get specific quest (returns undefined if not found)
const quest = getQuestByDay(12);

// Internal: Merge weeks and validate
const validated = mergeAndValidate();
```

**Usage Pattern**:

```typescript
// ✅ GOOD - Use data-loader API
import { getAllQuests, getQuestByDay } from "@/lib/data-loader";
const quests = getAllQuests();

// ❌ BAD - Direct JSON import
import uke1 from "@/data/uke1_oppdrag.json";
```

### Content Principles

- **Quest-driven unlocking**: Mission content drives diary entries, modules, badges
- **Separation of concerns**: Static content separate from quest progression
- **Norwegian language**: All content in Norwegian for authentic experience
- **Easy editing**: JSON files allow content changes without code modifications
- **Build-time safety**: Validation catches errors before app runs

## Date Handling System

### Critical: Centralized Date Utilities

**ALL date/time operations MUST go through** `src/lib/date-utils.ts`. Direct `new Date()` usage is prohibited.

### Core Functions

```typescript
// Get current date with mock support
const today = getCurrentDate();

// Get current day (1-31)
const currentDay = getCurrentDay();

// Get current month (1-12)
const currentMonth = getCurrentMonth();

// Check if calendar is active (Dec 1-24)
const isActive = isCalendarActive();

// Check if specific quest day is accessible
const canAccess = isDayAccessible(12);

// Get ISO string with mock support
const isoString = getISOString();

// Format helpers
const dateStr = formatDate(new Date());
const dateTimeStr = formatDateTime(new Date());

// Debug current configuration
const debugInfo = getDateDebugInfo();
```

### Mock Support

Environment variables override system date:

```bash
# Mock specific day (1-31)
NEXT_PUBLIC_MOCK_DAY=12

# Mock specific month (1-12)
NEXT_PUBLIC_MOCK_MONTH=12
```

**Mock Priority**: `NEXT_PUBLIC_MOCK_DAY` and `NEXT_PUBLIC_MOCK_MONTH` override system date when set.

### Usage Pattern

```typescript
// ❌ BAD - Direct date usage
const today = new Date();
const currentDay = today.getDate();
const isDecember = today.getMonth() === 11;

// ✅ GOOD - Centralized date utilities
import {
  getCurrentDay,
  getCurrentMonth,
  isDayAccessible,
} from "@/lib/date-utils";
const currentDay = getCurrentDay();
const isDecember = getCurrentMonth() === 12;
const canAccessDay = isDayAccessible(currentDay);
```

### Why Centralized Date Handling?

- **Testability**: Easy to mock dates for testing all 24 days
- **Consistency**: Single source of truth for date logic
- **Flexibility**: Can swap implementation without changing call sites
- **Debug**: Clear visibility into date configuration

## Authentication & Multi-Tenancy

### Dual-Code System

NisseKomm uses a **two-code authentication system** for family multi-tenancy:

1. **Kid Code** (theme-based, memorable)
   - Format: `{THEME_WORD}{YEAR}` (e.g., "NISSEKRAFT2024")
   - Generated from Snøfall vocabulary (~20 words)
   - Used by children to access main app
   - Collision detection ensures uniqueness

2. **Parent Code** (secure, alphanumeric)
   - Format: `NORDPOL-{5_CHARS}` (e.g., "NORDPOL-8N4K2")
   - Random alphanumeric generation
   - Used to access parent guide at `/nissemor-guide` (session-based login)
   - Verified via `/api/auth/verify` endpoint

### Registration Flow

```
Parent visits /register
    ↓
Enters family data:
  - Family name (optional)
  - Kid names (1-4, required)
  - Friend names (0-15, optional)
  - Parent email (optional)
    ↓
Backend generates:
  - UUID sessionId
  - Unique kid code
  - Unique parent code
    ↓
Creates documents:
  - familyCredentials (Sanity)
  - userSession (Sanity)
    ↓
Displays codes to parent
```

### Login Flow

```
User enters code at boot screen
    ↓
POST /api/auth/login { code }
    ↓
Backend:
  - Determines code type (kid/parent)
  - Queries familyCredentials
  - Returns { sessionId, role }
    ↓
Frontend:
  - Stores sessionId in cookie
  - Calls StorageManager.setAuthenticated(true, sessionId)
  - Creates SanityStorageAdapter(sessionId)
    ↓
Session persists across devices
```

### Parent Guide Access

```
Parent visits /nissemor-guide
    ↓
GuideAuth component:
  - Checks for existing session cookie (nissekomm-parent-auth)
  - If no cookie: Shows login form
    ↓
Parent enters parent code in login form
    ↓
  - POST /api/auth/verify { code }
  - Backend checks if code matches session's parentCode
  - Returns { isParent: true/false }
    ↓
If verified: Store session in cookie, show parent guide
If failed: Show error message
```

### Session Storage (Sanity)

**familyCredentials** schema:

- `kidCode`: string (unique)
- `parentCode`: string (unique)
- `sessionId`: string (UUID, links to userSession)
- `familyName`: string (optional)
- `kidNames`: string[] (1-4)
- `friendNames`: string[] (0-15)
- `parentEmail`: string (optional)
- `createdAt`: datetime

**userSession** schema:

- `_id`: string (UUID sessionId)
- `sessionId`: string (UUID, indexed)
- `friendNames`: string[] (0-15, synced from familyCredentials)
- Game state fields (submittedCodes, viewedEmails, etc.)

### Friend Names Feature

Friend names are used to personalize the Nice List (`snill_slem_liste.txt`):

1. Parents enter 0-15 friend names during registration
2. Stored in both `familyCredentials` and `userSession`
3. `NisseNetUtforsker` component fetches via `StorageManager.getFriendNames()`
4. Names appear in Nice List after Day 23 completion:
   - Player names (from Day 23) with ⭐ marker
   - Friend names (from registration) as regular entries

### Migration from Old System

Old system (pre-multi-tenancy):

- Used `NEXT_PUBLIC_BOOT_PASSWORD` environment variable
- SHA-256 hash of password = sessionId (64 hex chars)
- No family registration or codes

Migration script (`scripts/migrate-sessions.ts`):

- Finds old sessions (64-char sessionId)
- Prompts for family data
- Generates UUID + codes
- Updates documents
- Preserves game progress

**Usage**:

```bash
# Development dataset (safe for testing)
pnpm migrate:dev

# Production dataset (requires confirmation)
pnpm migrate:prod

# Dry run (preview without changes)
pnpm migrate:dry-run

# Manual invocation with options
npx tsx scripts/migrate-sessions.ts --dataset development
npx tsx scripts/migrate-sessions.ts --dataset production --dry-run
```

**Safety Features**:

- `--dataset` flag to specify target (production/development)
- `--dry-run` mode for risk-free preview
- Explicit "MIGRATE PRODUCTION" confirmation prompt
- Clear visual feedback of active configuration

---

## Registration Security

### Access Control

The registration endpoint (`/register`) can be protected with an optional share key for private distribution among friends/family.

**Environment Configuration**:

```bash
# Open registration (anyone can register)
REGISTRATION_SHARE_KEY=

# Protected registration (requires secret key)
REGISTRATION_SHARE_KEY=HEMMELIG_NOKKEL_2024
```

When a share key is set:

- Registration form displays "REGISTRERINGSNØKKEL" input field
- API validates shareKey matches environment variable
- Returns 403 Forbidden if key is missing/incorrect

**Distribution Strategy**:

1. Set `REGISTRATION_SHARE_KEY` in production `.env`
2. Share the URL with the key: `https://yourdomain.com/register?key=HEMMELIG_NOKKEL_2024`
3. Users copy-paste the key into the registration form

### Security Measures

**Documented (Not Implemented - Low Risk)**:

The following security measures are documented but not implemented, as the application is intended for private friend/family distribution with low abuse risk:

1. **Rate Limiting**: No IP-based throttling on registration endpoint
   - **Risk**: Spam registrations could bloat database
   - **Mitigation**: Share key provides basic access control
   - **Future**: Implement if public deployment needed

2. **CAPTCHA/Bot Protection**: No automated bot detection
   - **Risk**: Bots could spam registrations
   - **Mitigation**: Share key blocks automated discovery
   - **Future**: Add reCAPTCHA if abuse detected

3. **Registration Audit Logging**: No IP/timestamp tracking
   - **Risk**: Difficult to track abuse patterns
   - **Mitigation**: Sanity Studio provides manual review
   - **Future**: Add logging if operational visibility needed

4. **GDPR Compliance**: Basic data collection, no deletion mechanism
   - **Risk**: EU privacy law requirements not fully met
   - **Mitigation**: Family/friend use case has implied consent
   - **Future**: Add account deletion API for compliance

**Implemented Security Features**:

- ✅ **Email Validation**: Proper regex pattern (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- ✅ **Input Sanitization**: Length limits, character validation, duplicate detection
- ✅ **Code Collision Prevention**: Checks existing codes before generation
- ✅ **localStorage Backup**: Codes saved temporarily (1-hour expiry) to prevent loss
- ✅ **Before-Unload Warning**: Browser prompt if user tries to leave success page
- ✅ **Share Key Protection**: Optional access control for private deployments
- ✅ **Test Login Feature**: Pre-fills kid code for immediate verification

### Data Protection

**User Data Stored**:

- Family name (optional, max 50 chars)
- Kid names (1-4, max 20 chars each)
- Friend names (0-15, max 20 chars each)
- Parent email (optional, validated format)
- Access codes (kidCode, parentCode)
- Session UUID

**Storage Location**:

- Sanity CMS (when `STORAGE_BACKEND=sanity`)
- localStorage (when `STORAGE_BACKEND=localStorage`)

**Data Retention**:

- Permanent unless manually deleted via Sanity Studio
- No automatic expiration or cleanup

---

**Last Updated**: November 2025
**Maintained By**: AI Coding Agents
