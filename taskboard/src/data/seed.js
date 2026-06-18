// Seed data for the mock backend. This is the "fixture" the in-memory/localStorage
// database is initialized from on first run (see api/mockDb.js).

export const SEED_USERS = [
  { id: 'u_amara', name: 'Amara Singh', email: 'amara@ledger.dev', password: 'demo1234', color: '#2F6F62', initials: 'AS' },
  { id: 'u_devon', name: 'Devon Cole', email: 'devon@ledger.dev', password: 'demo1234', color: '#C9A66B', initials: 'DC' },
  { id: 'u_priya', name: 'Priya Nair', email: 'priya@ledger.dev', password: 'demo1234', color: '#E2703A', initials: 'PN' },
  { id: 'u_marco', name: 'Marco Bell', email: 'marco@ledger.dev', password: 'demo1234', color: '#4F7942', initials: 'MB' }
]

export const SEED_WORKSPACES = [
  { id: 'w_atlas', name: 'Atlas Studio', slug: 'atlas-studio', memberIds: ['u_amara', 'u_devon', 'u_priya'] },
  { id: 'w_northwind', name: 'Northwind Labs', slug: 'northwind-labs', memberIds: ['u_amara', 'u_marco'] },
  { id: 'w_solo', name: "Amara's Sandbox", slug: 'amara-sandbox', memberIds: ['u_amara'] }
]

export const SEED_BOARDS = [
  {
    id: 'b_launch',
    workspaceId: 'w_atlas',
    title: 'Product Launch',
    description: 'Everything needed to ship the v2.0 launch across web, mobile, and docs.',
    isPublic: true,
    columns: [
      { id: 'c_backlog', title: 'Backlog' },
      { id: 'c_progress', title: 'In Progress' },
      { id: 'c_review', title: 'In Review' },
      { id: 'c_done', title: 'Done' }
    ]
  },
  {
    id: 'b_design',
    workspaceId: 'w_atlas',
    title: 'Design System',
    description: 'Component library, tokens, and documentation for the shared design system.',
    isPublic: false,
    columns: [
      { id: 'c2_backlog', title: 'Backlog' },
      { id: 'c2_progress', title: 'In Progress' },
      { id: 'c2_done', title: 'Done' }
    ]
  },
  {
    id: 'b_infra',
    workspaceId: 'w_northwind',
    title: 'Infrastructure Migration',
    description: 'Move core services from the legacy cluster to the new region.',
    isPublic: true,
    columns: [
      { id: 'c3_backlog', title: 'Backlog' },
      { id: 'c3_progress', title: 'In Progress' },
      { id: 'c3_blocked', title: 'Blocked' },
      { id: 'c3_done', title: 'Done' }
    ]
  },
  {
    id: 'b_sandbox',
    workspaceId: 'w_solo',
    title: 'Personal Scratchpad',
    description: 'A private board for trying things out.',
    isPublic: false,
    columns: [
      { id: 'c4_todo', title: 'To Do' },
      { id: 'c4_done', title: 'Done' }
    ]
  }
]

const t = (offsetHours) => new Date(Date.now() - offsetHours * 3600 * 1000).toISOString()

export const SEED_TASKS = [
  // -- Product Launch board --
  { id: 'task_1', boardId: 'b_launch', columnId: 'c_backlog', order: 0, title: 'Draft launch announcement', description: 'Write the blog post and email copy for the v2.0 announcement.', priority: 'medium', assigneeId: 'u_priya', createdAt: t(72), updatedAt: t(40) },
  { id: 'task_2', boardId: 'b_launch', columnId: 'c_backlog', order: 1, title: 'Localize landing page', description: 'Translate the marketing site into FR, DE, and JA.', priority: 'low', assigneeId: null, createdAt: t(60), updatedAt: t(60) },
  { id: 'task_3', boardId: 'b_launch', columnId: 'c_backlog', order: 2, title: 'Record demo video', description: 'A 90 second walkthrough of the new board view.', priority: 'medium', assigneeId: 'u_devon', createdAt: t(50), updatedAt: t(50) },
  { id: 'task_4', boardId: 'b_launch', columnId: 'c_progress', order: 0, title: 'Build pricing page', description: 'New tiers: Free, Team, Enterprise. Needs a comparison table.', priority: 'high', assigneeId: 'u_devon', createdAt: t(80), updatedAt: t(6) },
  { id: 'task_5', boardId: 'b_launch', columnId: 'c_progress', order: 1, title: 'Set up status page', description: 'status.ledger.app should reflect uptime for API and web.', priority: 'medium', assigneeId: 'u_amara', createdAt: t(40), updatedAt: t(20) },
  { id: 'task_6', boardId: 'b_launch', columnId: 'c_review', order: 0, title: 'Review onboarding emails', description: 'Three-part welcome sequence drafted by Priya, needs a second pass.', priority: 'medium', assigneeId: 'u_amara', createdAt: t(30), updatedAt: t(3) },
  { id: 'task_7', boardId: 'b_launch', columnId: 'c_done', order: 0, title: 'Finalize launch date', description: 'Locked: March 14th, 9am PT.', priority: 'high', assigneeId: 'u_amara', createdAt: t(96), updatedAt: t(90) },
  { id: 'task_8', boardId: 'b_launch', columnId: 'c_done', order: 1, title: 'Approve new logo', description: 'Signed off by brand and legal.', priority: 'low', assigneeId: 'u_priya', createdAt: t(100), updatedAt: t(95) },

  // -- Design System board --
  { id: 'task_9', boardId: 'b_design', columnId: 'c2_backlog', order: 0, title: 'Audit color contrast', description: 'Check all text/background pairs against WCAG AA.', priority: 'medium', assigneeId: null, createdAt: t(20), updatedAt: t(20) },
  { id: 'task_10', boardId: 'b_design', columnId: 'c2_progress', order: 0, title: 'Build Button component variants', description: 'Primary, secondary, ghost, destructive — with size scale.', priority: 'high', assigneeId: 'u_devon', createdAt: t(15), updatedAt: t(2) },
  { id: 'task_11', boardId: 'b_design', columnId: 'c2_done', order: 0, title: 'Define spacing scale', description: '4px base unit, 8-step scale.', priority: 'low', assigneeId: 'u_devon', createdAt: t(40), updatedAt: t(35) },

  // -- Infrastructure Migration board --
  { id: 'task_12', boardId: 'b_infra', columnId: 'c3_backlog', order: 0, title: 'Inventory legacy services', description: 'List every service running on the old cluster with owners.', priority: 'medium', assigneeId: 'u_marco', createdAt: t(50), updatedAt: t(50) },
  { id: 'task_13', boardId: 'b_infra', columnId: 'c3_progress', order: 0, title: 'Provision new region', description: 'Stand up VPC, subnets, and IAM roles in the new region.', priority: 'high', assigneeId: 'u_marco', createdAt: t(30), updatedAt: t(5) },
  { id: 'task_14', boardId: 'b_infra', columnId: 'c3_blocked', order: 0, title: 'Migrate billing DB', description: 'Blocked on finance sign-off for the maintenance window.', priority: 'high', assigneeId: 'u_amara', createdAt: t(25), updatedAt: t(10) },
  { id: 'task_15', boardId: 'b_infra', columnId: 'c3_done', order: 0, title: 'Migrate auth service', description: 'Completed with zero downtime via blue/green rollout.', priority: 'medium', assigneeId: 'u_marco', createdAt: t(60), updatedAt: t(45) },

  // -- Sandbox board --
  { id: 'task_16', boardId: 'b_sandbox', columnId: 'c4_todo', order: 0, title: 'Try the new task editor', description: 'Just poking around.', priority: 'low', assigneeId: 'u_amara', createdAt: t(5), updatedAt: t(5) }
]

export const SEED_ACTIVITY = [
  { id: 'act_1', workspaceId: 'w_atlas', boardId: 'b_launch', taskId: 'task_4', actorId: 'u_devon', type: 'updated', message: 'updated "Build pricing page"', timestamp: t(6) },
  { id: 'act_2', workspaceId: 'w_atlas', boardId: 'b_launch', taskId: 'task_6', actorId: 'u_amara', type: 'commented', message: 'moved "Review onboarding emails" into In Review', timestamp: t(3) },
  { id: 'act_3', workspaceId: 'w_northwind', boardId: 'b_infra', taskId: 'task_14', actorId: 'u_amara', type: 'blocked', message: 'flagged "Migrate billing DB" as blocked', timestamp: t(10) }
]
