# Supabase Integration & MCP Setup Guide

This project uses **Supabase** for backend operations with a prepared Model Context Protocol (MCP) configuration for enhanced AI support.

## Current Supabase Integration

### Direct Supabase Client (Currently Active)

The project already integrates Supabase directly through:

- **Server client:** `src/lib/supabase/server.ts`
- **Client client:** `src/lib/supabase/client.ts`
- **Database migrations:** `supabase/migrations/`

You can use these immediately for backend operations.

## Supabase MCP (Planned Feature)

When the `@modelcontextprotocol/server-supabase` package becomes available, you'll be able to:

### 1. Install Supabase MCP Package

```bash
npm install @modelcontextprotocol/server-supabase
```

### 2. Configure Environment

Add to your `.env.local`:

```
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

### 3. Enable MCP in VS Code

Add to VS Code settings (`.vscode/settings.json`):

```json
{
  "github.copilot.advanced": {
    "mcpEnabled": true
  }
}
```

## Usage with Claude

Once MCP is available and configured, you can ask Claude to:

### Current Workaround: Direct SQL Queries

While MCP is in development, you can access Supabase directly:

1. **Supabase Dashboard:** https://app.supabase.com
2. **SQL Editor:** Write queries directly
3. **Table Editor:** Visual data management
4. **Auth Management:** User administration

Example SQL queries you can run:

```sql
-- List all users and their roles
SELECT
  p.email,
  p.full_name,
  om.role,
  o.name as organization
FROM profiles p
JOIN organization_members om ON p.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
ORDER BY om.role DESC;

-- Add a new employee
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('org-uuid', 'user-uuid', 'employee');

-- Update employee role
UPDATE organization_members
SET role = 'manager'
WHERE user_id = 'user-uuid';

-- Get team member distribution
SELECT team_role, COUNT(*) as count
FROM team_members
WHERE team_id = 'team-uuid'
GROUP BY team_role;
```

### Database Operations (When MCP Available)

- **Query data:** "List all users with their roles"
- **Insert data:** "Add a new employee with role viewer"
- **Update data:** "Change user 123's role to manager"
- **Delete data:** "Remove inactive users"

### Schema Inspection

- **Table structure:** "Show me the team_members table schema"
- **Relationships:** "What are the foreign keys in organization_members?"
- **Policies:** "List RLS policies for the teams table"

### Real-time Features

- **Subscribe to changes:** "Watch for new organization_members entries"
- **Batch operations:** "Update all employees' roles to employee level"

### Examples

```
"Claude, I need to create 5 test users with different roles using Supabase MCP"

"Add a team_member relationship for user X to team Y with role 'member'"

"Query the organization_members table and group by role to see distribution"
```

## MCP Server Configuration

The configuration file `mcp.json` defines:

- **Server**: Supabase MCP server
- **Environment variables**: Auto-loaded from `.env.local`
- **Status**: Enabled by default

### Manual MCP Server Start

```bash
# Start MCP server directly (optional)
npx @modelcontextprotocol/server-supabase
```

## Troubleshooting

### "MCP not responding"

- Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env.local`
- Ensure service role key has proper permissions
- Check network connectivity to Supabase

### "Permission denied" errors

- Verify RLS policies allow the operation
- Check user role has required permission
- Review Supabase audit logs for blocked operations

### "Table not found" errors

- Confirm table name spelling (case-sensitive)
- Run migrations: `supabase db push`
- Check schema in Supabase dashboard

## Accessing Supabase Today

### Option 1: Supabase Dashboard

Perfect for manual operations and administration:

- URL: https://app.supabase.com
- Features: Table Editor, SQL Editor, Auth, Policies, Real-time
- Use for: User setup, testing, quick queries

### Option 2: Direct Database Queries

Edit files in the project:

**Server-side (server actions):**

```typescript
// src/app/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";

export async function myAction() {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("*");
  return data;
}
```

**Client-side (React components):**

```typescript
// src/components/myComponent.tsx
"use client";
import { createClient } from "@/lib/supabase/client";

export default function MyComponent() {
  useEffect(() => {
    const supabase = createClient();
    // Perform queries
  }, []);
}
```

### Option 3: Existing Server Actions

Use the employee management and team management pages which already have:

- Role assignment
- User management
- Bulk operations
- XLS import/export

## When MCP Becomes Available

1. **Always use service role key** for administrative operations
2. **Never expose keys** in client-side code
3. **Test RLS policies** before production deployment
4. **Monitor MCP queries** for performance
5. **Keep Supabase schema documented** in migrations

## Available Resources

- **Supabase Docs:** https://supabase.com/docs
- **MCP Spec:** https://modelcontextprotocol.io/
- **Project Migrations:** `supabase/migrations/`
- **Database Schema:** See `.instructions.md` for table structure

## Integration with Development Workflow

When using Claude with MCP enabled:

1. Ask for database operations naturally
2. Claude will execute through Supabase MCP
3. Results are returned directly in chat
4. Complex operations are batched automatically
5. RLS policies are automatically enforced

## Security Notes

- Service role key has full database access (admin)
- Never commit `.env.local` to git (already in `.gitignore`)
- Rotate keys regularly in Supabase dashboard
- Audit all MCP operations in Supabase logs
- Use RLS policies for data isolation

---

**Version:** 1.0.0  
**Last Updated:** 2026-06-24
