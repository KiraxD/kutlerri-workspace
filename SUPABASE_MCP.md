# Supabase MCP Setup Guide

This project is configured to use **Supabase Model Context Protocol (MCP)** for enhanced backend support and database operations through AI agents.

## What is Supabase MCP?

Supabase MCP is a Model Context Protocol server that provides:
- Direct database query execution
- Real-time subscription management
- Authentication token handling
- Row-level security (RLS) policy management
- Table schema introspection
- API endpoint integration

## Installation

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

Once configured, you can ask Claude to:

### Database Operations
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

## Best Practices

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
