import type { AppUser, UserRoleType } from '../types';

interface CloudflareProfile {
  uid: string;
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRoleType;
  tier?: AppUser['tier'];
}

const requestProfile = async (firebaseUser: any): Promise<CloudflareProfile> => {
  const token = typeof firebaseUser.getIdToken === 'function'
    ? await firebaseUser.getIdToken().catch(() => '')
    : '';

  const response = await fetch('/api/auth/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Profile request failed (${response.status})`);
  }

  const data = await response.json() as { user: CloudflareProfile };
  return data.user;
};

export const syncCloudflareUserProfile = async (firebaseUser: any): Promise<AppUser> => {
  const profile = await requestProfile(firebaseUser);
  return {
    ...firebaseUser,
    uid: profile.uid || firebaseUser.uid,
    email: profile.email || firebaseUser.email,
    displayName: profile.displayName || firebaseUser.displayName,
    photoURL: profile.photoURL || firebaseUser.photoURL,
    role: profile.role || 'user',
    tier: profile.tier || 'free',
  } as AppUser;
};
