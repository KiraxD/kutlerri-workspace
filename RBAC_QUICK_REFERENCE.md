# RBAC Quick Reference Guide

## Role Hierarchy

```
5: Super Admin  - Full system access
4: Admin        - Org management, cannot delete org
3: Manager      - Team/project management
2: Employee     - Task creator, read-most
1: Viewer       - Read-only access
```

## Navigation Visibility by Role

```
Super Admin, Admin, Manager:
  ├─ Search, Home, Inbox, My Tasks, Favorites
  ├─ Initiatives, Epics, Projects, Cycles, Roadmap
  └─ Vault, Teams, Settings

Employee:
  ├─ Search, Home, Inbox, My Tasks, Favorites
  ├─ Projects, Vault
  └─ Settings

Viewer:
  ├─ Search, Home, Inbox, My Tasks, Favorites
  ├─ Projects, Vault
  └─ Settings
```

## File Locations

| Purpose           | File                                   |
| ----------------- | -------------------------------------- |
| Permission Matrix | `src/lib/permissions.ts`               |
| Role Fetching     | `src/lib/use-org-role.ts`              |
| Server Protection | `src/lib/auth-helpers.ts`              |
| UI Guard          | `src/components/permission-guard.tsx`  |
| Permission Button | `src/components/permission-button.tsx` |
| Role Badge        | `src/components/role-badge.tsx`        |
| Navigation        | `src/components/sidebar.tsx`           |

## Common Functions

### Check Permission (UI)

```typescript
import { hasPermission } from "@/lib/permissions";

if (hasPermission(role, "deleteProject")) {
  // Show delete button
}
```

### Get User Role (Client)

```typescript
import { useOrgRole } from "@/lib/use-org-role";

const { role, loading } = useOrgRole(orgId);
```

### Check Permission (Server)

```typescript
import { verifyPermission } from "@/lib/auth-helpers";

const { userId, orgId } = await verifyPermission("updateTask");
```

### Conditional Render (Component)

```typescript
import { PermissionGuard } from '@/components/permission-guard'

<PermissionGuard role={role} permission="deleteTask" fallback={null}>
  <DeleteButton />
</PermissionGuard>
```

### Permission-Aware Button

```typescript
import { PermissionButton } from '@/components/permission-button'

<PermissionButton role={role} permission="createProject">
  Create Project
</PermissionButton>
```

### Show Role Badge

```typescript
import { RoleBadge } from '@/components/role-badge'

<RoleBadge role={userRole} />
```

## Permission Categories (49 total)

| Category      | Count | Examples                                             |
| ------------- | ----- | ---------------------------------------------------- |
| Organization  | 7     | createOrganization, updateOrganization               |
| Users & Teams | 6     | inviteUsers, manageUserRoles, manageTeams            |
| Projects      | 4     | createProject, updateProject, deleteProject          |
| Tasks         | 6     | createTask, updateTask, assignTask                   |
| Vault         | 8     | createVault, createDocument, approveDocuments        |
| Planning      | 12    | createCycle, createInitiative, createEpic            |
| Milestones    | 3     | createMilestone, updateMilestone, deleteMilestone    |
| Access        | 3     | viewAuditLogs, manageApiTokens, viewAllNotifications |

## Protected Server Actions

Current:

- ✅ `createTask` - Checks `createTask` permission
- ✅ `createTeamAndOrg` - Checks `createOrganization` permission

Needs Protection:

- ⚠️ `updateTask` - Add `verifyPermission('updateTask')`
- ⚠️ `deleteTask` - Add `verifyPermission('deleteTask')`
- ⚠️ All other CRUD operations

## Role Details

### Super Admin

- Access: EVERYTHING
- Use Case: System administrator
- Created when: First organization setup

### Admin

- Access: Everything except org deletion, billing, system settings
- Limitations: Cannot delete organization, manage billing
- Use Case: Organization administrator

### Manager

- Access: Team/project creation, document approval, user invitation
- Limitations: Cannot delete teams/projects, manage roles
- Use Case: Team lead, project manager

### Employee

- Access: Create/edit own tasks, create documents, read most resources
- Limitations: Cannot create projects, assign tasks, delete anything
- Use Case: Team member, contributor

### Viewer

- Access: Read-only access to projects, tasks, vault
- Limitations: Cannot create, update, or delete anything
- Use Case: Stakeholder, observer, auditor

## Implementation Pattern for New Pages

1. **Add to Navigation Visibility:**

   ```typescript
   // In src/lib/permissions.ts
   export const NAV_VISIBILITY: Record<OrgRole, string[]> = {
     super_admin: [..., 'new-page'],
     admin: [..., 'new-page'],
     // ...
   }
   ```

2. **Update Sidebar:**

   ```typescript
   {isNavItemVisible(role, 'new-page') && (
     <NavItem href="/new-page" label="New Page" />
   )}
   ```

3. **Protect Actions:**

   ```typescript
   const { userId, orgId } = await verifyPermission("requiredPermission");
   ```

4. **Add Permission Checks to UI:**
   ```typescript
   <PermissionGuard role={role} permission="updateFeature">
     <UpdateButton />
   </PermissionGuard>
   ```

## Troubleshooting

### User Can't See Navigation Item

1. Check `NAV_VISIBILITY` in `permissions.ts`
2. Verify user role in `organization_members` table
3. Check sidebar has `role` prop from layout

### Permission Denied But Should Pass

1. Verify permission name matches in `permissions.ts`
2. Check role hierarchy (`ROLE_HIERARCHY`)
3. Test with `hasPermission(role, 'permission')`

### Server Action Throws Permission Error

1. Add `import { verifyPermission } from '@/lib/auth-helpers'`
2. Call `await verifyPermission('permission')` at start of action
3. Use returned `userId`, `orgId`, or `role`

---

## Dashboard Role Examples

### Super Admin View

```
┌─ Search
├─ Home
├─ Inbox
├─ My Tasks
├─ Favorites
├─ Initiatives
├─ Epics
├─ Projects
├─ Cycles
├─ Roadmap
├─ Vault
├─ Teams
└─ Settings
```

### Employee View

```
┌─ Search
├─ Home
├─ Inbox
├─ My Tasks
├─ Favorites
├─ Projects
├─ Vault
└─ Settings
```

### Viewer View

```
┌─ Search
├─ Home
├─ Inbox
├─ My Tasks
├─ Favorites
├─ Projects
├─ Vault
└─ Settings
```

---

For full details, see [RBAC_ENFORCEMENT_REPORT.md](RBAC_ENFORCEMENT_REPORT.md)
