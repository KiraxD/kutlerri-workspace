/**
 * RBAC Permission System - Centralized Source of Truth
 * Defines all roles, permission mappings, and helper functions
 */

export type OrgRole = 'super_admin' | 'admin' | 'manager' | 'employee' | 'viewer'
export type TeamRole = 'team_lead' | 'senior_member' | 'member' | 'guest'

/**
 * Role Hierarchy (from most to least privileged)
 */
export const ROLE_HIERARCHY: Record<OrgRole, number> = {
  super_admin: 5,
  admin: 4,
  manager: 3,
  employee: 2,
  viewer: 1,
}

/**
 * Role Display Names
 */
export const ROLE_DISPLAY_NAMES: Record<OrgRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
  viewer: 'Viewer',
}

/**
 * Role Descriptions
 */
export const ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  super_admin: 'Full system access, can manage all organizations',
  admin: 'Organization-level admin, manage teams and users',
  manager: 'Team management and project oversight',
  employee: 'Create and manage assigned tasks',
  viewer: 'Read-only access to organization data',
}

/**
 * Permission Matrix: What each role can do
 */
const PERMISSIONS_MATRIX: Record<OrgRole, Record<string, boolean>> = {
  super_admin: {
    // Organization Management
    createOrganization: true,
    updateOrganization: true,
    deleteOrganization: true,
    manageOrganizationSettings: true,
    manageBillingAndSubscription: true,
    viewSystemSettings: true,
    manageSystemSettings: true,

    // User & Team Management
    inviteUsers: true,
    removeUsers: true,
    manageUserRoles: true,
    manageTeams: true,
    createTeam: true,
    deleteTeam: true,

    // Project Management
    createProject: true,
    updateProject: true,
    deleteProject: true,
    manageProjectSettings: true,

    // Task Management
    createTask: true,
    updateTask: true,
    deleteTask: true,
    assignTask: true,
    editTaskOfOthers: true,
    deleteTaskOfOthers: true,

    // Vault Management
    createVault: true,
    updateVault: true,
    deleteVault: true,
    manageVaultPermissions: true,
    createDocument: true,
    updateDocument: true,
    deleteDocument: true,
    approveDocuments: true,

    // Cycle & Initiative Management
    createCycle: true,
    updateCycle: true,
    deleteCycle: true,
    createInitiative: true,
    updateInitiative: true,
    deleteInitiative: true,
    createEpic: true,
    updateEpic: true,
    deleteEpic: true,
    createStory: true,
    updateStory: true,
    deleteStory: true,

    // Milestone & Roadmap
    createMilestone: true,
    updateMilestone: true,
    deleteMilestone: true,

    // Access Control
    viewAuditLogs: true,
    manageApiTokens: true,
    viewAllNotifications: true,
  },

  admin: {
    // Organization Management
    createOrganization: false,
    updateOrganization: true,
    deleteOrganization: false,
    manageOrganizationSettings: true,
    manageBillingAndSubscription: false,
    viewSystemSettings: false,
    manageSystemSettings: false,

    // User & Team Management
    inviteUsers: true,
    removeUsers: true,
    manageUserRoles: true,
    manageTeams: true,
    createTeam: true,
    deleteTeam: true,

    // Project Management
    createProject: true,
    updateProject: true,
    deleteProject: true,
    manageProjectSettings: true,

    // Task Management
    createTask: true,
    updateTask: true,
    deleteTask: true,
    assignTask: true,
    editTaskOfOthers: true,
    deleteTaskOfOthers: true,

    // Vault Management
    createVault: true,
    updateVault: true,
    deleteVault: true,
    manageVaultPermissions: true,
    createDocument: true,
    updateDocument: true,
    deleteDocument: true,
    approveDocuments: true,

    // Cycle & Initiative Management
    createCycle: true,
    updateCycle: true,
    deleteCycle: true,
    createInitiative: true,
    updateInitiative: true,
    deleteInitiative: true,
    createEpic: true,
    updateEpic: true,
    deleteEpic: true,
    createStory: true,
    updateStory: true,
    deleteStory: true,

    // Milestone & Roadmap
    createMilestone: true,
    updateMilestone: true,
    deleteMilestone: true,

    // Access Control
    viewAuditLogs: true,
    manageApiTokens: false,
    viewAllNotifications: true,
  },

  manager: {
    // Organization Management
    createOrganization: false,
    updateOrganization: false,
    deleteOrganization: false,
    manageOrganizationSettings: false,
    manageBillingAndSubscription: false,
    viewSystemSettings: false,
    manageSystemSettings: false,

    // User & Team Management
    inviteUsers: true,
    removeUsers: false,
    manageUserRoles: true,
    manageTeams: true,
    createTeam: true,
    deleteTeam: false,

    // Project Management
    createProject: true,
    updateProject: true,
    deleteProject: false,
    manageProjectSettings: true,

    // Task Management
    createTask: true,
    updateTask: true,
    deleteTask: false,
    assignTask: true,
    editTaskOfOthers: true,
    deleteTaskOfOthers: false,

    // Vault Management
    createVault: true,
    updateVault: true,
    deleteVault: false,
    manageVaultPermissions: false,
    createDocument: true,
    updateDocument: true,
    deleteDocument: false,
    approveDocuments: true,

    // Cycle & Initiative Management
    createCycle: true,
    updateCycle: true,
    deleteCycle: false,
    createInitiative: true,
    updateInitiative: true,
    deleteInitiative: false,
    createEpic: true,
    updateEpic: true,
    deleteEpic: false,
    createStory: true,
    updateStory: true,
    deleteStory: false,

    // Milestone & Roadmap
    createMilestone: true,
    updateMilestone: true,
    deleteMilestone: false,

    // Access Control
    viewAuditLogs: false,
    manageApiTokens: false,
    viewAllNotifications: false,
  },

  employee: {
    // Organization Management
    createOrganization: false,
    updateOrganization: false,
    deleteOrganization: false,
    manageOrganizationSettings: false,
    manageBillingAndSubscription: false,
    viewSystemSettings: false,
    manageSystemSettings: false,

    // User & Team Management
    inviteUsers: false,
    removeUsers: false,
    manageUserRoles: false,
    manageTeams: false,
    createTeam: false,
    deleteTeam: false,

    // Project Management
    createProject: false,
    updateProject: false,
    deleteProject: false,
    manageProjectSettings: false,

    // Task Management
    createTask: true,
    updateTask: true,
    deleteTask: false,
    assignTask: false,
    editTaskOfOthers: false,
    deleteTaskOfOthers: false,

    // Vault Management
    createVault: false,
    updateVault: false,
    deleteVault: false,
    manageVaultPermissions: false,
    createDocument: true,
    updateDocument: true,
    deleteDocument: false,
    approveDocuments: false,

    // Cycle & Initiative Management
    createCycle: false,
    updateCycle: false,
    deleteCycle: false,
    createInitiative: false,
    updateInitiative: false,
    deleteInitiative: false,
    createEpic: false,
    updateEpic: false,
    deleteEpic: false,
    createStory: true,
    updateStory: true,
    deleteStory: false,

    // Milestone & Roadmap
    createMilestone: false,
    updateMilestone: false,
    deleteMilestone: false,

    // Access Control
    viewAuditLogs: false,
    manageApiTokens: false,
    viewAllNotifications: false,
  },

  viewer: {
    // Organization Management
    createOrganization: false,
    updateOrganization: false,
    deleteOrganization: false,
    manageOrganizationSettings: false,
    manageBillingAndSubscription: false,
    viewSystemSettings: false,
    manageSystemSettings: false,

    // User & Team Management
    inviteUsers: false,
    removeUsers: false,
    manageUserRoles: false,
    manageTeams: false,
    createTeam: false,
    deleteTeam: false,

    // Project Management
    createProject: false,
    updateProject: false,
    deleteProject: false,
    manageProjectSettings: false,

    // Task Management
    createTask: false,
    updateTask: false,
    deleteTask: false,
    assignTask: false,
    editTaskOfOthers: false,
    deleteTaskOfOthers: false,

    // Vault Management
    createVault: false,
    updateVault: false,
    deleteVault: false,
    manageVaultPermissions: false,
    createDocument: false,
    updateDocument: false,
    deleteDocument: false,
    approveDocuments: false,

    // Cycle & Initiative Management
    createCycle: false,
    updateCycle: false,
    deleteCycle: false,
    createInitiative: false,
    updateInitiative: false,
    deleteInitiative: false,
    createEpic: false,
    updateEpic: false,
    deleteEpic: false,

    // Milestone & Roadmap
    createMilestone: false,
    updateMilestone: false,
    deleteMilestone: false,

    // Access Control
    viewAuditLogs: false,
    manageApiTokens: false,
    viewAllNotifications: false,
  },
}

/**
 * Check if a role has a specific permission
 * @param role - The organization role
 * @param permission - The permission to check
 * @returns true if the role has the permission, false otherwise
 */
export function hasPermission(role: OrgRole | null | undefined, permission: string): boolean {
  if (!role) return false
  return PERMISSIONS_MATRIX[role]?.[permission] ?? false
}

/**
 * Check if a role is at least as privileged as the target role
 * @param role - The user's role
 * @param targetRole - The minimum role required
 * @returns true if user's role >= target role in hierarchy
 */
export function isAtLeastRole(role: OrgRole | null | undefined, targetRole: OrgRole): boolean {
  if (!role) return false
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[targetRole]
}

/**
 * Get all permissions for a role
 * @param role - The organization role
 * @returns object with all permissions for the role
 */
export function getPermissions(role: OrgRole | null | undefined): Record<string, boolean> {
  if (!role) return {}
  return PERMISSIONS_MATRIX[role] ?? {}
}

/**
 * Navigation visibility by role
 * Returns which nav items should be visible
 */
export const NAV_VISIBILITY: Record<OrgRole, string[]> = {
  super_admin: [
    'search',
    'home',
    'inbox',
    'my-tasks',
    'favorites',
    'initiatives',
    'epics',
    'stories',
    'projects',
    'cycles',
    'roadmap',
    'vault',
    'teams',
    'employees',
    'settings',
  ],
  admin: [
    'search',
    'home',
    'inbox',
    'my-tasks',
    'favorites',
    'initiatives',
    'epics',
    'stories',
    'projects',
    'cycles',
    'roadmap',
    'vault',
    'teams',
    'settings',
  ],
  manager: [
    'search',
    'home',
    'inbox',
    'my-tasks',
    'favorites',
    'initiatives',
    'epics',
    'stories',
    'projects',
    'cycles',
    'roadmap',
    'vault',
    'teams',
    'settings',
  ],
  employee: ['search', 'home', 'inbox', 'my-tasks', 'favorites', 'stories', 'projects', 'vault', 'settings'],
  viewer: ['search', 'home', 'inbox', 'my-tasks', 'favorites', 'projects', 'vault'],
}

/**
 * Check if a nav item should be visible to a role
 * @param role - The organization role
 * @param navItem - The navigation item to check
 * @returns true if the nav item should be visible
 */
export function isNavItemVisible(role: OrgRole | null | undefined, navItem: string): boolean {
  // If no role yet, show all items (full access until org role assigned)
  if (!role) {
    const defaultItems = [
      'search',
      'home',
      'inbox',
      'my-tasks',
      'favorites',
      'initiatives',
      'epics',
      'stories',
      'projects',
      'cycles',
      'roadmap',
      'vault',
      'teams',
      'settings',
    ]
    return defaultItems.includes(navItem)
  }
  return NAV_VISIBILITY[role]?.includes(navItem) ?? false
}

/**
 * Get all visible nav items for a role
 * @param role - The organization role
 * @returns array of visible nav item keys
 */
export function getVisibleNavItems(role: OrgRole | null | undefined): string[] {
  if (!role) {
    return [
      'search',
      'home',
      'inbox',
      'my-tasks',
      'favorites',
      'initiatives',
      'epics',
      'stories',
      'projects',
      'cycles',
      'roadmap',
      'vault',
      'teams',
      'settings',
    ]
  }
  return NAV_VISIBILITY[role] ?? []
}
