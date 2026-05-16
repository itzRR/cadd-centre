// ============================================================
// CADD Centre - Granular Permissions System
// Admins/super_admins can grant extra access beyond base role.
// Permissions stored as JSONB array in profiles.permissions
// ============================================================

import type { UserRole } from '@/types'

// All available permission keys
export type Permission =
  | 'ims_overview'
  | 'ims_marketing'
  | 'ims_academic'
  | 'ims_finance'
  | 'ims_hr'
  | 'ims_users'
  | 'ims_tasks'
  | 'ims_roster'
  | 'ims_control_panel'
  | 'asms_full'
  | 'task_delete'

export interface PermissionDef {
  key: Permission
  label: string
  description: string
  group: 'IMS' | 'ASMS' | 'Tasks'
}

export const PERMISSION_DEFS: PermissionDef[] = [
  { key: 'ims_overview',     label: 'IMS Overview',     description: 'Access the IMS dashboard overview',      group: 'IMS' },
  { key: 'ims_marketing',    label: 'Marketing',         description: 'Access the Marketing section',           group: 'IMS' },
  { key: 'ims_academic',     label: 'Academic Ops',      description: 'Access the Academic Operations section', group: 'IMS' },
  { key: 'ims_finance',      label: 'Finance',           description: 'Access the Finance section',             group: 'IMS' },
  { key: 'ims_hr',           label: 'HR',                description: 'Access the HR section',                  group: 'IMS' },
  { key: 'ims_users',        label: 'Add/Edit Users',    description: 'Manage staff user accounts',             group: 'IMS' },
  { key: 'ims_tasks',        label: 'Tasks',             description: 'Access ops tasks & minute trackers',     group: 'Tasks' },
  { key: 'ims_roster',       label: 'Roster',            description: 'Access the staff roster',                group: 'Tasks' },
  { key: 'ims_control_panel',label: 'Control Panel',    description: 'Access system control panel',            group: 'IMS' },
  { key: 'asms_full',        label: 'Full ASMS Access',  description: 'Access all ASMS academic sections',      group: 'ASMS' },
  { key: 'task_delete',      label: 'Delete Tasks',      description: 'Can delete tasks and trackers',          group: 'Tasks' },
]

// Base permissions each role automatically has (no need to grant them)
export const ROLE_BASE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin:      ['ims_overview','ims_marketing','ims_academic','ims_finance','ims_hr','ims_users','ims_tasks','ims_roster','ims_control_panel','asms_full','task_delete'],
  admin:            ['ims_overview','ims_marketing','ims_academic','ims_finance','ims_hr','ims_users','ims_tasks','ims_roster','ims_control_panel','asms_full','task_delete'],
  academic_head:    ['ims_academic','ims_tasks','ims_roster','ims_overview'],
  academic_officer: ['ims_academic','ims_tasks','ims_roster'],
  marketing_head:   ['ims_marketing','ims_tasks','ims_roster','ims_overview'],
  marketing_officer:['ims_marketing','ims_tasks','ims_roster'],
  finance_head:     ['ims_finance','ims_tasks','ims_roster','ims_overview'],
  finance_officer:  ['ims_finance','ims_tasks','ims_roster'],
  hr_head:          ['ims_hr','ims_tasks','ims_roster','ims_overview'],
  hr_officer:       ['ims_hr','ims_tasks','ims_roster'],
  staff:            ['ims_tasks','ims_roster'],
  lecturer:         ['ims_academic'],
  student:          [],
}

/**
 * Check if a user has a specific permission,
 * considering both their role's base permissions and any extra granted permissions.
 */
export function hasPermission(
  role: UserRole,
  grantedPermissions: string[] | null | undefined,
  permission: Permission,
): boolean {
  const base = ROLE_BASE_PERMISSIONS[role] || []
  const granted = grantedPermissions || []
  return base.includes(permission) || granted.includes(permission)
}

/**
 * Get all effective permissions for a user (base + granted extras).
 */
export function getEffectivePermissions(role: UserRole, grantedPermissions: string[] | null | undefined): Permission[] {
  const base = ROLE_BASE_PERMISSIONS[role] || []
  const granted = grantedPermissions || []
  const combined = new Set([...base, ...granted])
  return Array.from(combined) as Permission[]
}

/**
 * Get only the extra permissions that are NOT already in the base role.
 */
export function getExtraPermissions(role: UserRole, grantedPermissions: string[] | null | undefined): Permission[] {
  const base = ROLE_BASE_PERMISSIONS[role] || []
  const granted = grantedPermissions || []
  return (granted as Permission[]).filter(p => !base.includes(p))
}

// Path → required permission mapping used by middleware
export const PATH_PERMISSION_MAP: Array<{ pathPrefix: string; permission: Permission }> = [
  { pathPrefix: '/admin/ims/control-panel', permission: 'ims_control_panel' },
  { pathPrefix: '/admin/ims/users',         permission: 'ims_users' },
  { pathPrefix: '/admin/ims/finance',       permission: 'ims_finance' },
  { pathPrefix: '/admin/ims/hr',            permission: 'ims_hr' },
  { pathPrefix: '/admin/ims/marketing',     permission: 'ims_marketing' },
  { pathPrefix: '/admin/ims/academic',      permission: 'ims_academic' },
  { pathPrefix: '/admin/ims/tasks',         permission: 'ims_tasks' },
  { pathPrefix: '/admin/ims/roster',        permission: 'ims_roster' },
  { pathPrefix: '/admin/ims',               permission: 'ims_overview' },
]
