# Hierarchical Task Assignment System

## Overview

This document describes the hierarchical task assignment system implemented in Kutlerri, which allows super users, admins, and managers to assign tasks to people below them in the organizational hierarchy.

## Organizational Hierarchy

```
Organization
│
├─ Teams
│  └─ Employees (Team Members)
│
├─ Initiatives (Org-level)
│  ├─ Epics (Org-level)
│  │  └─ Tasks (Team-level)
│  │     └─ Sub-tasks (Task-level)
│
├─ Projects (Team-level)
├─ Cycles (Team-level)
├─ Roadmap (Org-level)
├─ Vault (Org-level)
└─ Employees (Org-level)
```

## Role Hierarchy and Assignment Permissions

### Organization Roles (RBAC)

| Role        | Hierarchy Level | Assignment Rights                          |
| ----------- | --------------- | ------------------------------------------ |
| super_admin | 5               | Can assign to anyone in their organization |
| admin       | 4               | Can assign to anyone in their organization |
| manager     | 3               | Can assign to team members only            |
| employee    | 2               | Cannot assign tasks                        |
| viewer      | 1               | Cannot assign tasks (read-only)            |

### Assignment Rules

1. **Super Admin & Admin**: Can assign tasks to any user in their organization
2. **Manager**: Can assign tasks only to members of their team
3. **Employee & Viewer**: Cannot assign tasks

## Implementation Details

### Key Files

1. **src/lib/task-assignment-helpers.ts**
   - `getAssignableUsers()`: Get list of users that can be assigned a task
   - `canAssignTask()`: Verify if actor has permission to assign task
   - `getTeamMembers()`: Get team members for a specific team
   - `getOrgMembers()`: Get organization members
   - `getContextualAssignees()`: Get users assignable in a given context

2. **src/app/(dashboard)/tasks/new/actions.ts**
   - `assignTaskAction()`: Updated to verify hierarchical permissions
   - `unassignTaskAction()`: Unassign a task
   - `getTaskAssignees()`: Get assignees for task assignment UI

3. **src/components/task-assignment-selector.tsx**
   - `TaskAssignmentSelector`: Interactive dropdown for assigning tasks
   - `TaskAssignmentButton`: Button component for quick assignment

4. **src/components/task-assignment-display.tsx**
   - `TaskAssignmentDisplay`: Client component showing current assignee with assignment button

5. **src/app/(dashboard)/task/[identifier]/page.tsx**
   - Updated task detail page to use `TaskAssignmentDisplay` component

### Data Flow

```
User clicks "Assign" button
    ↓
TaskAssignmentSelector component loads
    ↓
getTaskAssignees(teamId) server action called
    ↓
getAssignableUsers(actorId, orgId, teamId) helper called
    ↓
Actor's role is fetched
    ↓
Based on role:
  - super_admin/admin: Fetch all org members
  - manager: Fetch team members only
    ↓
Filtered user list displayed in dropdown
    ↓
User selects assignee
    ↓
assignTaskAction() called with validation
    ↓
canAssignTask() verifies permissions
    ↓
If allowed: Task updated and notification sent
If denied: Error message displayed
```

## Usage Examples

### Super Admin Assigning Task

1. Navigate to task detail page
2. Click on Assignee field
3. See all organization members in dropdown
4. Select any user to assign

### Manager Assigning Task

1. Navigate to task detail page
2. Click on Assignee field
3. See only team members in dropdown
4. Select team member to assign

### Employee Trying to Assign

1. Navigate to task detail page
2. Assignee field shows current assignee (no dropdown)
3. Cannot change assignment (permission denied)

## Permission Verification Flow

```typescript
async function canAssignTask(
  actorId: string,
  orgId: string,
  teamId: string,
  assigneeId: string
) {
  1. Get actor's role from organization_members table
  2. Check if actor's role >= manager
  3. If super_admin/admin:
     - Verify assignee is organization member
     - Return allowed: true
  4. If manager:
     - Verify assignee is in team_members table
     - Verify actor is in team_members table
     - Return allowed: true or false
  5. Otherwise: Return allowed: false
}
```

## Database Tables Used

- **organization_members**: Organization-level user roles
- **team_members**: Team membership and assignments
- **tasks**: Task records with assignee_id field
- **profiles**: User information (name, email)

## Notifications

When a task is assigned:

1. Notification created for assignee (if different from assigner)
2. Type: `task_assigned`
3. Sent immediately upon assignment

## UI Components

### TaskAssignmentSelector

- Interactive dropdown showing available assignees
- Filters users based on role hierarchy
- Handles assignment/unassignment

### TaskAssignmentButton

- Quick-access button on task detail page
- Shows current assignee
- Opens assignment selector on click

### TaskAssignmentDisplay

- Displays current assignee
- Shows assignment button
- Client-side state management

## Error Handling

- Invalid permission: Returns clear error message
- User not found: Error message displayed
- Network errors: Graceful error handling with retry option
- Assignment conflicts: Handled by Supabase constraints

## Testing Checklist

- [ ] Super admin can assign to any organization member
- [ ] Admin can assign to any organization member
- [ ] Manager can assign to team members only
- [ ] Manager cannot assign to users outside team
- [ ] Employee cannot see assignment UI
- [ ] Assignment notifications are sent correctly
- [ ] Unassignment works correctly
- [ ] Error messages display on permission denied
- [ ] Dropdown shows correct user count for each role level
- [ ] Task detail page reflects assignment changes

## Security Considerations

1. **Permission Check Hierarchy**: All checks follow role hierarchy
2. **Team Isolation**: Managers cannot see users outside their team
3. **Notification Privacy**: Only assigned users receive notifications
4. **Audit Trail**: All assignments tracked (future: audit_logs table)
5. **Cascading Permissions**: Follows organizational structure

## Future Enhancements

1. **Batch Assignment**: Assign multiple tasks at once
2. **Delegation**: Allow users to delegate assignment rights
3. **Approval Workflow**: Require manager approval for assignments
4. **Load Balancing**: Auto-assign based on current workload
5. **Skill-based Assignment**: Match task to skilled team members
6. **Assignment History**: Track who assigned task and when
7. **Reassignment Rules**: Define rules for automatic reassignment
