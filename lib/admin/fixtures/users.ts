/**
 * Demo users.
 *
 * Two of these are the real named contacts published on the public site, so
 * the audit trail reads like the actual company. Only Nikki Shah and the
 * signed-in admin can approve — that is what makes "second approver" real
 * rather than decorative.
 */

import type { User, UserId } from '../types';

export const CURRENT_USER_ID = 'u-mekuriya';

export const users: User[] = [
  {
    id: 'u-mekuriya',
    name: 'M. Mekuriya',
    shortName: 'M. Mekuriya',
    role: 'Administrator',
    email: 'admin@intllogic.com',
    canApprove: true,
    initials: 'MM',
  },
  {
    id: 'u-shah',
    name: 'Nikki Shah',
    shortName: 'N. Shah',
    role: 'Chief Executive Officer',
    email: 'teaming@intllogic.com',
    canApprove: true,
    initials: 'NS',
  },
  {
    id: 'u-connelly',
    name: 'Stephen Connelly',
    shortName: 'S. Connelly',
    role: 'Program Manager, Business Development',
    email: 'contracts@intllogic.com',
    canApprove: false,
    initials: 'SC',
  },
  {
    id: 'u-okafor',
    name: 'Adaeze Okafor',
    shortName: 'A. Okafor',
    role: 'Contracts Administrator',
    email: 'contracts@intllogic.com',
    canApprove: false,
    initials: 'AO',
  },
  {
    id: 'u-brennan',
    name: 'Dana Brennan',
    shortName: 'D. Brennan',
    role: 'Communications Lead',
    email: 'inquiries@intllogic.com',
    canApprove: false,
    initials: 'DB',
  },
  {
    id: 'u-vasquez',
    name: 'Luis Vásquez',
    shortName: 'L. Vásquez',
    role: 'Quality and Compliance Manager',
    email: 'inquiries@intllogic.com',
    canApprove: false,
    initials: 'LV',
  },
];

const byId = new Map<UserId, User>(users.map((u) => [u.id, u]));

export function userById(id: UserId): User {
  const user = byId.get(id);
  if (!user) throw new Error(`Unknown demo user: ${id}`);
  return user;
}

/** Name only, for audit lines where the role would be noise. */
export function userName(id: UserId): string {
  return byId.get(id)?.name ?? 'Unknown user';
}

export const approvers = users.filter((u) => u.canApprove);
