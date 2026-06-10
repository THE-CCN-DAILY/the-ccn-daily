import { adminAuthHeaders } from './adminAuth';

export interface HouseholdMember {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  role: 'owner' | 'member' | 'pending';
  status: 'active' | 'pending';
  joinedAt?: string;
  invitedAt?: string;
  updatedAt?: string;
}

export interface GroupMember {
  id: string;
  leaderId: string;
  name: string;
  email: string;
  role: 'leader' | 'member' | 'pending';
  status: 'active' | 'pending';
  engagementScore: number;
  lastActiveAt?: string;
  invitedAt?: string;
  updatedAt?: string;
}

export type GroupAssignmentType = 'devotional' | 'course' | 'challenge' | 'practice';

export interface GroupAssignment {
  id: string;
  leaderId: string;
  title: string;
  type: GroupAssignmentType;
  progress: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HouseholdOverview {
  members: HouseholdMember[];
  maxSeats: number;
}

export interface GroupOverview {
  members: GroupMember[];
  assignments: GroupAssignment[];
}

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
};

const householdUrl = (userId: string, suffix = '') =>
  `/api/users/${encodeURIComponent(userId)}/household${suffix}`;

const groupUrl = (userId: string, suffix = '') =>
  `/api/users/${encodeURIComponent(userId)}/group${suffix}`;

export const listHouseholdMembers = async (userId: string): Promise<HouseholdOverview> => {
  const data = await requestJson<{ members: HouseholdMember[]; maxSeats: number }>(
    householdUrl(userId, '/members'),
    { headers: await adminAuthHeaders() }
  );
  return { members: data.members || [], maxSeats: Number(data.maxSeats || 5) };
};

export const inviteHouseholdMember = async (
  userId: string,
  email: string,
  name?: string
): Promise<HouseholdMember> => {
  const data = await requestJson<{ member: HouseholdMember | null }>(
    householdUrl(userId, '/invites'),
    {
      method: 'POST',
      headers: await adminAuthHeaders(),
      body: JSON.stringify({ email, name }),
    }
  );
  if (!data.member) throw new Error('The invitation could not be recorded. Please try again.');
  return data.member;
};

export const removeHouseholdMember = async (userId: string, memberId: string): Promise<void> => {
  await requestJson<{ ok: true }>(
    householdUrl(userId, `/members/${encodeURIComponent(memberId)}`),
    { method: 'DELETE', headers: await adminAuthHeaders() }
  );
};

export const getGroupOverview = async (userId: string): Promise<GroupOverview> => {
  const data = await requestJson<{ members: GroupMember[]; assignments: GroupAssignment[] }>(
    groupUrl(userId, '/overview'),
    { headers: await adminAuthHeaders() }
  );
  return { members: data.members || [], assignments: data.assignments || [] };
};

export const inviteGroupMember = async (
  userId: string,
  email: string,
  name?: string
): Promise<GroupMember> => {
  const data = await requestJson<{ member: GroupMember | null }>(groupUrl(userId, '/invites'), {
    method: 'POST',
    headers: await adminAuthHeaders(),
    body: JSON.stringify({ email, name }),
  });
  if (!data.member) throw new Error('The invitation could not be recorded. Please try again.');
  return data.member;
};

export const removeGroupMember = async (userId: string, memberId: string): Promise<void> => {
  await requestJson<{ ok: true }>(groupUrl(userId, `/members/${encodeURIComponent(memberId)}`), {
    method: 'DELETE',
    headers: await adminAuthHeaders(),
  });
};

export const createGroupAssignment = async (
  userId: string,
  title: string,
  type: GroupAssignmentType
): Promise<GroupAssignment> => {
  const data = await requestJson<{ assignment: GroupAssignment | null }>(
    groupUrl(userId, '/assignments'),
    {
      method: 'POST',
      headers: await adminAuthHeaders(),
      body: JSON.stringify({ title, type }),
    }
  );
  if (!data.assignment) throw new Error('The assignment could not be created. Please try again.');
  return data.assignment;
};

export const removeGroupAssignment = async (userId: string, assignmentId: string): Promise<void> => {
  await requestJson<{ ok: true }>(
    groupUrl(userId, `/assignments/${encodeURIComponent(assignmentId)}`),
    { method: 'DELETE', headers: await adminAuthHeaders() }
  );
};
