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

The palette and type system (deep ink/jade/brass on a warm paper background, `Space Grotesk` for headings, `Inter` for body text, `JetBrains Mono` for timestamps/IDs/counts) is a deliberate choice away from default-Tailwind-indigo-on-white, meant to read like a ledger/ops-log rather than a generic SaaS template — fitting for a tool whose whole job is keeping an accurate, shared record of who's doing what. The one place the visual language gets more expressive is the **login screen**, which uses a Vanta.js (three.js) animated globe as a backdrop (`components/common/VantaBackground.jsx`) — recolored to the app's own jade/brass palette rather than Vanta's stock preset, and chosen specifically because a globe is a fitting visual shorthand for "multiple workspaces, one connected team," not decoration for its own sake. It's intentionally confined to the one unauthenticated, "first impression" screen; the working board surface stays plain and dense, in line with the brief's explicit ask for "usability and clarity over visual complexity" once someone is actually working. The effect also respects `prefers-reduced-motion` by simply not mounting.

## 10. Trade-offs and assumptions, summarized

- One active board in the store at a time, not a multi-board cache — simpler, costs a refetch when revisiting a board.
- Drag-and-drop reorder is optimistic with no rollback on failure (reconciled by the next poll instead) — smoother gesture, rare silent inconsistency window.
- The "other teammates editing things" activity is a client-side simulator writing to the same mock DB, not a second real backend connection — by design, since the brief explicitly allows simulating this via polling/timed events.
- SEO for public boards is meta-tag/JSON-LD injection at runtime, not SSR — covers JS-executing crawlers and link-unfurlers, not 100% of all possible crawlers.
- Board creation isn't implemented (only task create/edit/delete, which the brief requires); boards are seed data. Called out as the most obvious "if I had more time" addition, along with column management (add/rename/delete columns) and richer task metadata (due dates, labels, comments).
