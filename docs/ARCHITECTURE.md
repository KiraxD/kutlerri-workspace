# Kutlerri Workspace - Architecture & Schema

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- ShadCN UI
- Supabase (PostgreSQL, Auth, Realtime, Storage)

## Database Schema (Supabase)

### Core Entities
1. **users** (via `auth.users`) & **profiles**: User preferences, notification_preferences.
2. **organizations**: Top-level workspaces.
3. **teams**: Logical groupings within an organization. Issue identifiers use team prefixes (e.g., `KT`).
4. **projects**: Scoped bodies of work within teams.
5. **issues**: The core tracking entity.
   - Includes identifier (`KT-1`), estimate, status, priority.
6. **issue_relations**: Maps relationships between issues (parent/child, blocks, duplicates, related).
7. **comments**: Discussions on issues.

### Planning
8. **cycles**: Time-boxed sprints.
9. **milestones**: High-level markers for grouping work.
10. **roadmap_items**: Dependencies and high-level tracking across projects.

### Personalization & Productivity
11. **saved_views**: Custom filters and layouts saved by users.
12. **favorites**: Starred items (issues, projects, views) for the sidebar.
13. **labels**: Customizable tags for issues.

### Notifications & Activity
14. **activity_events**: Immutable audit log of all changes across entities.
15. **notifications**: Actionable alerts for mentions, assignments, and status updates (Inbox).
16. **inbox_items**: The state of inbox items (read/unread/archived) for a user.

## RLS Policies
- Row Level Security enforced via Supabase using Organization/Team membership mapping.

## State Management & Realtime
- Standard data fetching via React Server Components.
- Optimistic UI updates for high-interaction parts (shortcuts, issue drawer).
- Supabase Realtime subscriptions on `issues`, `comments`, and `activity_events` tables for live syncing.
