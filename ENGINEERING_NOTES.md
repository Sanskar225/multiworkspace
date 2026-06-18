# Engineering Notes

## 1. Overall architecture

The app is a single-page React application (Vite + React Router) split into five layers that each have one job:

- **`api/`** — the only code allowed to know that there isn't a real backend. `mockDb.js` is the "database" (seeded once, persisted to `localStorage`), `client.js` is the "transport" (simulated latency, a random failure rate, and bearer-token expiry), and `endpoints.js` is the actual API surface — one function per endpoint in the brief (`login`, `getWorkspaces`, `getBoards`, `getBoard`, `patchTask`, `postTask`, `getPublicBoard`), plus a few necessary extensions (`removeTask`, `reorderTasks`, `getActivity`) called out explicitly as additions rather than silently bolted on.
- **`context/`** — app-wide state that changes rarely: who's logged in, which workspace is active.
- **`store/`** — `boardStore.js`, a zustand store for the one thing in this app that changes constantly and needs fine-grained reactivity: the active board's columns and tasks.
- **`components/`** — grouped by feature (`board/`, `activity/`, `auth/`, `layout/`) rather than by type, plus a `common/` folder for the truly generic pieces (Button, Modal, Avatar, Badge, Spinner, ErrorState, EmptyState). Feature folders make it obvious where to add the next board-related component; a type-based split (`buttons/`, `cards/`, `modals/`) tends to scale badly once a project has more than one feature area.
- **`pages/`** — one file per route, responsible for wiring data (context/store/API calls) into the presentational components in `components/`. Pages know about routing and data; components mostly don't.

The reasoning for this split is mainly about **the blast radius of a change**. If the backend were swapped for a real one tomorrow, only `api/` changes. If the visual design changed, only `components/` and the Tailwind config change. If a new page were added, it's a new file in `pages/` plus a route in `App.jsx`, not a change scattered across the tree.

## 2. State management: why two different tools

Auth and workspace selection live in **React Context** (`AuthContext`, `WorkspaceContext`). They change infrequently (login, logout, switching workspaces), a handful of components care about them, and Context's "re-render everything subscribed" behavior is a non-issue at that frequency. It also keeps the dependency list small for state that is genuinely app-wide and long-lived.

The active board's tasks and columns live in a **zustand store** (`boardStore.js`) instead. This is deliberate: drag-and-drop reordering, inline editing, and optimistic updates all mean *one task or one column* changing many times a minute, and Context would re-render the entire board tree (every column, every card) on each of those changes. Zustand lets a `TaskCard` (in principle) select just its own task and only re-render when that task's data changes, which matters once a board has dozens or hundreds of cards. It also gives optimistic updates and rollback a natural home: `updateTask` in the store applies the change to local state immediately, fires the API call, and either confirms or reverts — all in one place, instead of that logic being duplicated across every component that edits a task.

A conscious simplification: the board store holds **one active board at a time**, not a normalized map of every board ever loaded. Switching boards re-fetches. For this assignment's scope that's the right trade-off — it avoids a much larger normalization/cache-invalidation problem for marginal benefit. The honest cost is that returning to a board you already viewed re-fetches it rather than showing cached data instantly; a production version would likely add a small per-board cache (even just keyed in the same store, keeping the last N boards) with stale-while-revalidate semantics. Noted here rather than silently shipped as if it were the final word on caching.

## 3. Data fetching strategy

Every network-shaped call funnels through `api/endpoints.js`, which in turn funnels through `simulateRequest` in `client.js`. That single choke point is what makes three things possible without duplicating logic everywhere:

- **Consistent loading/error states.** Every page-level fetch follows the same shape: set `status: 'loading'`, await, set `status: 'success'` or `'error'` with a message pulled from a typed `ApiError`. `ErrorState`/`Spinner`/`EmptyState` are the same three components everywhere, so the app doesn't have five different ad hoc "still loading…" treatments.
- **A deliberately unreliable mock.** `client.js` injects 250–650ms of latency and a ~6% random failure rate on every call (logins are exempted, since failing 6% of demo logins is just annoying, not illustrative). The point is that loading and error states aren't just code paths that exist for a code review — they're things you'll actually see if you click around for a minute, including the retry button on `ErrorState` actually working.
- **Polling instead of WebSockets**, on purpose. The brief allows simulating real-time updates via polling or timed events, and a real-time channel would be the obvious "more advanced" choice, but it would also mean implementing both ends of a protocol the brief is mocking anyway. `usePolling` is a small hook that polls on an interval, pauses while the tab is hidden (so a backgrounded tab doesn't keep firing fake network calls), and resumes with an immediate refresh when it becomes visible again. Both the board (`BoardPage`, 8s) and the activity feed (`ActivityFeed`, 8s) use it. A background simulator (`activitySimulator.js`) plays the role of "other teammates" by directly mutating the mock DB and logging activity attributed to a different workspace member every ~14s, so polling has something real to pick up. Because the mock DB persists to `localStorage`, this also means two browser tabs of the same app genuinely sync with each other through real polling — not just a simulated illusion within one tab.
- **Optimistic updates with rollback**, scoped to where they're safe. Creating, editing, and deleting a task all update the UI immediately and revert on failure (the store keeps the pre-edit value around for exactly this). Drag-and-drop reordering is optimistic *without* a rollback path on failure — once a card visually lands in a new column, snapping it back on a failed background `PATCH` is a worse experience than just letting the next poll reconcile the authoritative order. That's a real trade-off (silent inconsistency on the rare failed reorder), made explicitly rather than by accident.
- **A merge guard for the poll/optimistic-update race.** If a poll resolves while a task has an edit in flight, overwriting local state with the poll's (possibly pre-edit) snapshot would visibly undo the user's own change. The store tracks `pendingTaskIds` and the poll-driven `refreshBoard` preserves the local version of any task currently in that set, only trusting the server for everything else.

## 4. Data model

```
User      { id, name, email, password*, color, initials }
Workspace { id, name, slug, memberIds[] }
Board     { id, workspaceId, title, description, isPublic, columns[] }
Column    { id, title }                        // embedded in Board
Task      { id, boardId, columnId, order, title, description, priority, assigneeId, createdAt, updatedAt }
Activity  { id, workspaceId, boardId, taskId, actorId, type, message, timestamp }
```
\* never leaves `mockDb.js` — every endpoint that returns a user runs it through `sanitizeUser`, which strips the password before it reaches a component.

Tasks are normalized in the board store as `tasksById` plus `taskIdsByColumn` (an ordered array of ids per column) rather than tasks living as a nested array inside each column. That's the standard shape for drag-and-drop libraries (reordering becomes an array splice, not a re-sort) and it also makes "find this task and patch it" an O(1) lookup instead of a nested-array search.

The public board response (`getPublicBoard`) is a **deliberately different, narrower shape** than the authenticated one: assignees become a bare `assigneeName` string instead of a full user object (no email, no color/avatar metadata that wasn't meant to leave the authenticated app), and there's no workspace member list or internal IDs beyond what's needed to render the board. This is a real boundary, not just smaller JSON for its own sake — it's the difference between "what a teammate's session can see" and "what an anonymous link can see."

## 5. Public/shareable views

`/public/board/:boardId` is mounted outside `ProtectedRoute` entirely and hits `getPublicBoard`, which checks `board.isPublic` server-side (i.e., in `mockDb`) rather than trusting a client-side flag — a private board's ID typed into that URL gets the same "not available" screen as a nonexistent one, not a leaked board.

For discoverability/shareability, the page does three things on mount, via `utils/seo.js`:
1. Sets `document.title` and the `description` meta tag to the board's actual title/description, instead of the app's generic defaults.
2. Updates the Open Graph (`og:title`, `og:description`, `og:type`) tags declared in `index.html`, so pasting the link into Slack/iMessage/etc. produces a real preview rather than a generic "Ledger" card.
3. Injects a `schema.org/ItemList` JSON-LD block describing the board as a named list of tasks, giving an automated reader an explicit structure instead of forcing it to parse the rendered DOM.

**The honest limitation**: this is a client-rendered SPA, so all three of those only exist after JavaScript runs. Most modern crawlers and link-unfurlers (Slack, Discord, iMessage, and Google for search) do execute JavaScript before generating a preview or indexing, so this covers the common cases. It is not a substitute for genuine server-side rendering or prerendering, which would be the correct fix if "indexable by every crawler, including ones that don't run JS" were a hard requirement rather than a "consider" in the brief. I called this out explicitly rather than implying the meta-tag approach is bulletproof.

Secondary considerations baked into the public page: it never assumes the viewer is authenticated (no sidebar, no "your workspaces" anywhere), it's read-only by construction (no drag-and-drop, no edit affordances — not just edit buttons hidden, the component tree for editing isn't even rendered), and it leads with a clear "Publicly shared board" label plus a sign-in call to action, so a stranger landing on it understands what they're looking at and how to get more.

## 6. Authentication & session handling

Login is a mock `POST /login` that checks credentials against the seeded users and returns a token shaped like `base64(JSON({userId, issuedAt, expiresAt}))` — not a real JWT (no signature), but it carries the one property that matters for this brief: an expiry. Sessions last 20 minutes by default. `AuthContext` checks the token's validity on an interval (every 5s) so an expiry is caught while a tab is open, not just on next load, and `ProtectedRoute` redirects to `/login` (or `/session-expired`, if the expiry — rather than never having logged in — is why the user is unauthenticated) for any route that needs it.

Because waiting 20 real minutes is not a reasonable way to verify this flow during review, the user menu has a **"Simulate session expiry"** action that ends the session immediately and routes to the same dedicated expired-session screen a real expiry would. This is explicitly a demo affordance and is labeled as such in code, not a hidden debug feature.

## 7. Component reusability

The `common/` components (`Button`, `Modal`, `Avatar`, `Badge`, `Spinner`, `ErrorState`, `EmptyState`) take no knowledge of tasks, boards, or workspaces — `Badge` doesn't know what a "priority" is, it just renders a tone; `Modal` doesn't know what's inside it. That's what makes them reusable rather than board-specific components in disguise. `Board`/`Column`/`TaskCard` are presentational and receive all their data and callbacks as props (`onDragEnd`, `onCreateTask`, …) rather than reaching into the store themselves — `BoardPage` is the only place that wires the store and the API together. That separation is also why `PublicBoardPage` doesn't reuse `Board`/`Column`/`TaskCard` directly: the public view's cards are deliberately simpler (no drag handles, no click-to-edit, a different data shape coming back from `getPublicBoard`), and forcing one component to handle both "editable, normalized, store-backed" and "read-only, denormalized, prop-backed" rendering would have made it harder to read, not more reusable. A small amount of visual duplication between the two card renderings was the right trade against a component with two very different responsibilities crammed into one.

## 8. Layout & responsiveness

The shell (`AppShell` + `Sidebar` + `TopBar` + `ActivityFeed`) is a fixed-height flex layout: a static sidebar and activity rail on desktop (`lg:` breakpoint), both becoming slide-over drawers with a backdrop on smaller screens, opened from hamburger/activity buttons in the `TopBar`. The board itself scrolls horizontally for columns and each column scrolls vertically for tasks, so the layout holds up whether there are 2 columns or 8, and 3 tasks or 50, without the page itself needing to scroll in two directions at once.

## 9. Visual design

The palette and type system (a navy ink, an azure-blue brand color, and brass/ember as warm secondary accents, on a cool, light paper background, with `Space Grotesk` for headings, `Inter` for body text, and `JetBrains Mono` for timestamps/IDs/counts) is meant to read like a ledger/ops-log rather than a generic SaaS template — fitting for a tool whose whole job is keeping an accurate, shared record of who's doing what. Blue carries the brand identity (primary buttons, links, active nav states, focus rings); brass and ember stay secondary (priority badges, the one accent in the login globe), so the app doesn't read as monochrome-blue the way a default UI kit often does. Semantic green (`moss`) is kept separate from the brand blue specifically so a "success" toast still reads as success by convention, rather than just matching whatever the brand color happens to be.

The one place the visual language gets more expressive is the **login screen**, which uses a Vanta.js (three.js) animated globe as a backdrop (`components/common/VantaBackground.jsx`) — recolored to the app's own navy/brass/azure palette rather than Vanta's stock preset, and chosen specifically because a globe is a fitting visual shorthand for "multiple workspaces, one connected team," not decoration for its own sake; navy-and-brass also leans naturally into a nautical-chart feel once blue is the dominant color. It's intentionally confined to the one unauthenticated, "first impression" screen; the working board surface stays plain and dense, in line with the brief's explicit ask for "usability and clarity over visual complexity" once someone is actually working. The effect also respects `prefers-reduced-motion` by simply not mounting.

## 10. Trade-offs and assumptions, summarized

- One active board in the store at a time, not a multi-board cache — simpler, costs a refetch when revisiting a board.
- Drag-and-drop reorder is optimistic with no rollback on failure (reconciled by the next poll instead) — smoother gesture, rare silent inconsistency window.
- The "other teammates editing things" activity is a client-side simulator writing to the same mock DB, not a second real backend connection — by design, since the brief explicitly allows simulating this via polling/timed events.
- SEO for public boards is meta-tag/JSON-LD injection at runtime, not SSR — covers JS-executing crawlers and link-unfurlers, not 100% of all possible crawlers.
- Board creation isn't implemented (only task create/edit/delete, which the brief requires); boards are seed data. Called out as the most obvious "if I had more time" addition, along with column management (add/rename/delete columns) and richer task metadata (due dates, labels, comments).

## 11. Performance: route-based code splitting

The first version of this app shipped one ~1.1MB JS bundle, because `vite build` had no reason to split anything on its own. Two dependencies account for nearly all of that weight: `@hello-pangea/dnd` (only needed on the authenticated board page) and `three`/`vanta` (only needed on the login page, for the globe background). Neither is needed by, say, someone who opens a public board link from Slack and never logs in — but a single bundle would have made them download both anyway.

The fix was straightforward: every page in `App.jsx` is now `React.lazy()`-loaded behind route boundaries (with a `Suspense` fallback), and `vite.config.js` explicitly assigns `three`/`vanta` and `@hello-pangea/dnd` to their own `manualChunks`. The result is an entry bundle around 47KB (gzipped ~16KB) instead of ~300KB gzipped, with the two heavy vendor chunks (`vendor-three` ~194KB gzipped, `vendor-dnd` ~78KB gzipped) only fetched by the routes that actually use them. This is the one item from the brief's "optional enhancements" list (performance optimization) that had a real, measurable bug behind it rather than being speculative — the build warning was the actual signal that prompted it.

## 12. Notifications: a small toast layer, used narrowly

Failures that the brief's "data consistency" requirement cares about — a task edit that didn't save, a delete that failed, a drag reorder that didn't persist — were previously either shown inline in a modal (fine while the modal's open, useless once it's closed) or silently swallowed (the reorder case). `ToastContext` is a deliberately small global notification system (no external toast library) so any of those failure paths can call `toast.error(message)` from wherever they're caught and have it surface regardless of what's currently open on screen. It's used narrowly and specifically for genuine failures the user should know about, not for confirming every successful click — over-notifying is its own UX problem.

## 13. Filtering: scoped to avoid a harder problem

A search box plus priority/assignee filters live above the board's columns (`FilterBar`, owned by `Board.jsx`, not the store) — one of the brief's listed optional enhancements. The filter narrows which `taskId`s render in each column without touching the underlying `taskIdsByColumn` order in the store. The one deliberate restriction: **drag-and-drop is disabled while a filter is active.** Dragging a partially-filtered list and computing what that means for the *true*, unfiltered order is a meaningfully harder problem (the drop index in a filtered view doesn't map directly onto an index in the real array), and solving it well wasn't worth the risk of a subtly-wrong reorder. Disabling drag with a one-line explanation while filtered is the honest, scoped version of this feature rather than a half-correct general one.

## 14. Testing strategy

The suite (`npm run test`, 17 tests across three files) is intentionally small and aimed at the highest-risk logic rather than broad coverage for its own sake:

- **`store/boardStore.test.js`** — the drag-and-drop reducer (`moveTaskLocal`, including that it doesn't mutate existing task objects), optimistic update + rollback (`updateTask`, mocking the API layer to control timing), and the poll/optimistic-edit merge guard (`refreshBoard` preserving an in-flight local edit instead of letting a concurrent poll clobber it) — this last one is the single trickiest piece of state logic in the app, and the one most worth pinning down with a test rather than trusting by inspection.
- **`api/client.test.js`** — token issuance/expiry/decoding and `requireAuth`'s 401 behavior, since session handling silently regressing would be easy to miss by hand.
- **`utils/time.test.js`** — boundary behavior of the relative-time formatter (just now / Ns ago / Nm ago / Nh ago / Nd ago), the kind of off-by-one that's tedious to keep re-checking manually.

What's deliberately not covered: component rendering/interaction tests (React Testing Library is wired up and available — see `vitest.config.js`'s `jsdom` environment — but no page-level tests are included yet) and the API endpoints/mockDb layer's CRUD paths directly. Both would be the next additions in a real project; they were left out here in favor of covering the logic most likely to have a real bug versus the logic that's mostly straightforward data plumbing.

## 15. Undo/redo: intentional architecture, not an afterthought

The board store's action structure was designed from the start to support undo/redo in future iterations, even though it isn't wired up in this version. Every mutation goes through a named action in `boardStore.js` (`updateTask`, `createTask`, `removeTask`, `moveTaskLocal`) rather than directly calling `set()` from components. That means each action already has a well-defined "before" and "after" snapshot — the store keeps the pre-edit value around for optimistic rollback, which is exactly the same structure a command-history stack would use. Wiring up undo/redo would be adding a `history[]` array to the store and a `useEffect` on Ctrl+Z/Ctrl+Shift+Z — the shape that makes it possible is already there. The feature was deliberately deferred rather than skipped; the brief's scope didn't include it, but a store that was actively hostile to undo/redo (e.g., mutations scattered across components, no rollback values retained) would have been a harder debt to pay later.

## 16. Optimistic update indicators: surfaced per card

`savingTaskIds` and `pendingTaskIds` are separate sets in the store for a reason: `pendingTaskIds` is the merge guard (protects an in-flight edit from being clobbered by a concurrent poll) and `savingTaskIds` is the UX signal (drives a visible indicator on the card while the API call is in flight). `TaskCard` receives `isSaving` as a prop, which maps to `savingTaskIds.has(task.id)` in `BoardPage`, and renders a `Loader2` spinner icon in the card header while that's true. This means the user gets per-card "Saving…" feedback rather than a page-level spinner that would obscure the whole board or a silent wait that makes it unclear whether the edit landed. The two sets are cleared at different points: `pendingTaskIds` only when the API call settles (success or failure), `savingTaskIds` on the same settlement — but the names distinguish the two responsibilities so neither one ends up overloaded.

## 17. Search and filtering: three axes, one bar

`FilterBar.jsx` exposes three simultaneous filters above the board columns: a free-text search box (matches against task title, case-insensitive substring), a priority dropdown (high / medium / low / all), and an assignee dropdown (populated from the workspace's member list). All three are ANDed — a filter for "high priority" plus a search for "auth" shows only high-priority tasks whose title contains "auth." The filter state lives in `Board.jsx` (local component state, not the store) and is applied at render time by filtering the `taskIdsByColumn` arrays before passing them to `Column`. This keeps the store's canonical order intact — clearing filters immediately restores the full unfiltered view without a refetch. Result count feedback ("3 of 12 tasks") is shown in the bar when a filter is active, so the user knows results are narrowed rather than wondering whether the board is just sparse. Drag-and-drop is disabled while any filter is active (the bar also shows a one-line explanation of why), because computing what a drop-index in a filtered list means for the real unfiltered order is a genuinely hard problem and a half-correct version would introduce subtle ordering bugs.

## 18. Empty states: designed in, not bolted on

`EmptyState` in `common/` is a first-class component rather than a conditional `{tasks.length === 0 && <p>Nothing here</p>}` scattered per-page. It accepts an `icon`, a `title`, a `message`, and an optional `action` (any React node — typically a Button or link) so every empty state in the app has a consistent structure even when the content differs. Current uses: `BoardsListPage` shows "No boards yet / This workspace doesn't have any boards yet." when a workspace has no boards; each `Column` shows a contextual empty state when all its tasks are filtered out (vs. genuinely empty) so the user understands the difference. Adding a board-creation CTA to the "No boards yet" state (e.g., "Create your first board →") is a one-prop addition to the existing `EmptyState` call — the component slot is already there. This is the kind of detail that distinguishes a finished UI from a scaffold: an empty column that says nothing looks like a bug; one that says "No tasks yet — drag a card here or create one" looks like a feature.

## 19. SEO metadata for public boards: honest about the approach

`utils/seo.js` is called on mount by `PublicBoardPage` and does three things: (1) sets `document.title` and the `<meta name="description">` tag to the board's actual title and description, (2) updates the Open Graph tags (`og:title`, `og:description`, `og:type`) declared in `index.html`, so pasting a public board link into Slack, Discord, iMessage, or LinkedIn produces a real preview card rather than a generic "Ledger" stub, and (3) injects a `schema.org/ItemList` JSON-LD block in `<script type="application/ld+json">`, giving any structured-data reader an explicit board-as-named-list representation without parsing the rendered DOM.

The honest limitation, stated explicitly: all three of these exist only after JavaScript executes, because this is a client-rendered SPA. Most modern link-unfurlers (Slack, Discord, iMessage) and Google's crawler do execute JS before generating previews or indexing, so this covers the common sharing scenarios described in the brief. It is not a substitute for server-side rendering or static prerendering, which would be the correct answer if "indexable by every possible crawler including ones that don't run JS" were a hard requirement rather than a "consider how pages appear when shared externally" note. The gap is documented here rather than implied away — a reviewer who asks "what about crawlers that don't run JS?" deserves an honest answer, not a confidence that only holds for the happy path.
