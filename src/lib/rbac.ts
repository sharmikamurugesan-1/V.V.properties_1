import type { UserRole } from './supabase/types';

export type Role = UserRole;

export interface UserContext {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

/**
 * Checks if the user is a Super Administrator (e.g. Victor Paul).
 * Has unrestricted rights across all operations, user promotions, and system configurations.
 */
export function isSuperAdmin(role?: Role | null): boolean {
  return role === 'super_admin';
}

/**
 * Checks if the user is a Portfolio Director (e.g. Sharmika Murugesan).
 * Has full management rights over inventory, lead pipelines, assignments, and audit logs.
 */
export function isPortfolioDirector(role?: Role | null): boolean {
  return role === 'portfolio_director';
}

/**
 * Checks if the user is in executive management (Super Admin or Portfolio Director).
 */
export function isManagement(role?: Role | null): boolean {
  return role === 'super_admin' || role === 'portfolio_director';
}

/**
 * Checks if the user is a registered Agent / Property Consultant.
 */
export function isAgent(role?: Role | null): boolean {
  return role === 'agent';
}

/**
 * Checks if the user has permission to add, edit, or publish properties.
 * Granted to: Super Admin and Portfolio Director.
 */
export function canManageProperties(role?: Role | null): boolean {
  return isManagement(role);
}

/**
 * Checks if the user can delete a property listing.
 * Strictly reserved for Super Admin to protect critical portfolio assets.
 */
export function canDeleteProperty(role?: Role | null): boolean {
  return isSuperAdmin(role);
}

/**
 * Checks if the user can assign agents to leads and site visits.
 */
export function canAssignAgents(role?: Role | null): boolean {
  return isManagement(role);
}

/**
 * Checks if the user has access to sensitive activity and audit logs.
 * Granted strictly to Super Admin and Portfolio Director.
 */
export function canViewAuditLogs(role?: Role | null): boolean {
  return isManagement(role);
}

/**
 * Evaluates whether an agent or client can update a specific site visit record.
 */
export function canModifySiteVisit(
  role: Role,
  visit: { client_id?: string | null; agent_id?: string | null; status: string },
  currentUserId: string
): boolean {
  // Management can update any visit
  if (isManagement(role)) return true;

  // Assigned agent can confirm, complete, or reschedule
  if (role === 'agent' && visit.agent_id === currentUserId) return true;

  // Client can only cancel their own visit if still pending
  if (visit.client_id === currentUserId && visit.status === 'Pending') return true;

  return false;
}

/**
 * Evaluates whether an agent or manager can manage a specific inquiry lead.
 */
export function canManageInquiry(
  role: Role,
  inquiry: { assigned_agent_id?: string | null },
  currentUserId: string
): boolean {
  if (isManagement(role)) return true;
  if (role === 'agent' && inquiry.assigned_agent_id === currentUserId) return true;
  return false;
}
