// Root Pages middleware. Its only job is to reverse-proxy Firebase Auth's helper
// endpoints (/__/auth/* and /__/firebase/*) to the Firebase-hosted handler, so that
// signInWithRedirect runs under the app's OWN origin. That (a) brands the Google
// consent screen as theccndaily.com instead of ccn-daily.firebaseapp.com and (b) keeps
// the redirect-result cookie same-origin so Google sign-in works (popups are blocked on
// mobile). authDomain is set to the app host in firebase.ts.
//
// Everything else falls straight through via next() — the /api/* function and all
// static assets are unaffected.
//
// Dashboard prerequisites (one-time, founder):
//   - Firebase Console → Authentication → Settings → Authorized domains: add theccndaily.com
//   - Google Cloud Console → Credentials → OAuth client → Authorized redirect URIs:
//       add https://theccndaily.com/__/auth/handler
//   - Google Cloud Console → OAuth consent screen → set app name + branding

const FIREBASE_AUTH_ORIGIN = 'https://ccn-daily.firebaseapp.com';

const proxyToFirebaseAuth = async (request: Request): Promise<Response> => {
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, FIREBASE_AUTH_ORIGIN);

  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';

  const proxied = new Request(target.toString(), {
    method,
    headers: request.headers,
    // Buffer the body for non-GET to avoid streaming duplex constraints.
    body: hasBody ? await request.arrayBuffer() : undefined,
    // Relay Firebase's 302s (Google bounce + return) to the browser untouched.
    redirect: 'manual',
  });

  const upstream = await fetch(proxied);

  // Strip CSP/frame headers that would otherwise block the proxied handler/iframe.
  const headers = new Headers(upstream.headers);
  headers.delete('content-security-policy');
  headers.delete('content-security-policy-report-only');
  headers.delete('x-frame-options');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
};

export const onRequest = async (
  context: { request: Request; next: () => Promise<Response> },
): Promise<Response> => {
  const { pathname } = new URL(context.request.url);
  if (pathname.startsWith('/__/auth/') || pathname.startsWith('/__/firebase/')) {
    return proxyToFirebaseAuth(context.request);
  }
  return context.next();
};
