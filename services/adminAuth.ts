import { getAuth } from 'firebase/auth';

/**
 * Authorization headers for admin API calls.
 *
 * Sends the signed-in user's Firebase ID token as a Bearer token. The Cloudflare
 * Worker verifies it server-side (signature + issuer/audience) and authorizes the
 * request only if the verified email is on the ministry-owner allowlist. This
 * replaces the old, spoofable `x-admin-email` header scheme.
 */
export const adminAuthHeaders = async (): Promise<Record<string, string>> => {
  const user = getAuth().currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
};
