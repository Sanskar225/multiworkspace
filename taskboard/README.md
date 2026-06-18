# Ledger — Multi-Workspace Task Board

A frontend for a multi-workspace task board: authenticated team boards with drag-and-drop columns, a simulated live activity feed, and publicly shareable read-only board links — built against a fully mocked API layer so it runs standalone with no backend.

See **ENGINEERING_NOTES.md** for the architecture write-up (state management, data fetching, component organization, trade-offs). This file is just setup + a feature tour.

## Requirements

- Node.js 18+ (uses `structuredClone`, available natively in Node 18+/modern browsers)
- npm 9+

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

Other scripts:

```bash
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm run lint      # ESLint
```

There is no backend to start — `src/api/mockDb.js` is an in-memory "database" seeded on first run and persisted to `localStorage`, so your data (tasks you create, moves you make) survives a page refresh. Use the trash icon in a task, or just clear site data / open an incognito window, to reset to the seed state. There's also `resetDb()` exported from `mockDb.js` if you want to wire up a "reset demo data" button.

## Demo accounts

All use password `demo1234`:

| Email              | Belongs to                                    |
| ------------------ | --------------------------------------------- |
| `amara@ledger.dev` | Atlas Studio, Northwind Labs, amara's Sandbox |
| `devon@ledger.dev` | Atlas Studio                                  |
| `marco@ledger.dev` | Northwind Labs                                |

Sign in as **amara** to see the multi-workspace switcher in action (she's the only seeded user in more than one workspace).

## A quick tour

1. **Sign in** (`/login`) — pick a demo account from the list, or type one of the emails above.
2. **Pick a workspace** (`/workspaces`) — a user can belong to several; this is the landing page after login.
3. **Boards** (`/workspace/:id/boards`) — every board in the chosen workspace, with a public/private indicator and a "copy public link" action on public boards.
4. **Board view** (`/workspace/:id/board/:boardId`) — the core feature: drag tasks between and within columns, click a card to edit/delete it, click the `+` on a column to add one. Changes save optimistically (instantly in the UI, with a small spinner while the request is in flight, and a rollback if it fails).
5. **Activity panel** — the radio-icon button in the top bar (desktop) or activity rail opens a live log of who changed what. To make this interesting without a real second user, the app runs a background simulator (`src/api/activitySimulator.js`) that periodically has another workspace member move or update a random task. Leave a board open for ~15-30 seconds and watch a card move on its own, or a new line appear in the feed.
   - **To see genuine multi-tab "real-time" sync**: open the app in two browser tabs side by side, signed in to the same account. Since the mock database is backed by `localStorage`, an edit in one tab is picked up by the other tab's next poll (≤8s) — not just the simulator.
6. **Public link** — copy a public board's link from the boards list (or visit `/public/board/b_launch` directly) and open it in a private/incognito window. No login required; it's a clean read-only summary suitable for sharing externally, with page title/description and basic structured data set for link previews.
7. **Session expiry** — open the user menu (top right) → "Simulate session expiry" to immediately end the session and see the dedicated expired-session screen, without waiting for the real 20-minute timeout.

## Project structure

```
src/
  api/            mock "backend": client.js (transport+auth), mockDb.js (data), endpoints.js (the public API surface), activitySimulator.js
  context/        AuthContext, WorkspaceContext (app-wide, low-frequency state)
  store/          boardStore.js — zustand store for the active board (high-frequency state)
  hooks/          usePolling (generic interval hook used for both board sync and activity)
  components/     auth/, layout/, board/, activity/, common/ — grouped by feature, not by type
  pages/          one file per route
  utils/          seo.js (document title/meta/JSON-LD), time.js
  data/seed.js    the fixture data the mock DB is seeded from
```

## Known limitations (also covered in ENGINEERING_NOTES.md)

- This is a client-rendered SPA. Public board pages update `document.title`/meta tags and inject JSON-LD on the client, which covers most modern link-unfurlers and crawlers, but a fully bulletproof solution for very strict crawlers would be server-side rendering or prerendering those routes specifically.
- The mock API has a simulated random failure rate (~6%) and 250-650ms latency on purpose, so loading/error states are easy to exercise — if a demo click seems to "fail for no reason," that's the simulated flakiness, not a bug; retry.
- There's no backend, so "real" multi-user concurrency is approximated via `localStorage` + the background simulator described above, not a real WebSocket/SSE channel.
