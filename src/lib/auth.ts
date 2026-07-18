// ============================================================
// GreenMesh — Auth Layer (client-side session, localStorage)
// Roles: admin | provider | consumer
// ============================================================

export type AuthRole = 'admin' | 'provider' | 'consumer';

export interface AuthSession {
  userId: string;
  email: string;
  role: AuthRole;
  displayName: string;
  orgName?: string;
  expiresAt: number; // Unix ms
}

// ---- Demo credentials (no backend — hackathon demo) ----
export const DEMO_CREDENTIALS: Array<{
  email: string;
  password: string;
  role: AuthRole;
  userId: string;
  displayName: string;
  orgName?: string;
}> = [
  {
    email: 'admin@greenmesh.io',
    password: 'GreenMesh@2026',
    role: 'admin',
    userId: 'user-admin-001',
    displayName: 'Admin',
    orgName: 'GreenMesh Team',
  },
  {
    email: 'habib@techbd.io',
    password: 'Provider@123',
    role: 'provider',
    userId: 'user-pro-001',
    displayName: 'Habib',
    orgName: 'TechBD Compute',
  },
  {
    email: 'sakib@dgrid.com.bd',
    password: 'Provider@123',
    role: 'provider',
    userId: 'user-pro-002',
    displayName: 'Sakib',
    orgName: 'DGrid Solutions',
  },
  {
    email: 'nadia@oslo-hpc.no',
    password: 'Provider@123',
    role: 'provider',
    userId: 'user-pro-003',
    displayName: 'Nadia',
    orgName: 'Oslo University HPC',
  },
  {
    email: 'rahul@buet.ac.bd',
    password: 'Consumer@123',
    role: 'consumer',
    userId: 'user-con-001',
    displayName: 'Rahul',
    orgName: 'BUET CS Lab',
  },
  {
    email: 'fatema@du.ac.bd',
    password: 'Consumer@123',
    role: 'consumer',
    userId: 'user-con-002',
    displayName: 'Fatema',
    orgName: 'Dhaka University AI Group',
  },
];

const SESSION_KEY = 'greenmesh_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// ---- Read session ----
export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// ---- Write session ----
export function setSession(session: Omit<AuthSession, 'expiresAt'>): AuthSession {
  const full: AuthSession = { ...session, expiresAt: Date.now() + SESSION_TTL_MS };
  localStorage.setItem(SESSION_KEY, JSON.stringify(full));
  return full;
}

// ---- Clear session ----
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

// ---- Validate credentials ----
export function validateCredentials(
  email: string,
  password: string
): AuthSession | null {
  const cred = DEMO_CREDENTIALS.find(
    c => c.email.toLowerCase() === email.toLowerCase() && c.password === password
  );
  if (!cred) return null;
  return setSession({
    userId: cred.userId,
    email: cred.email,
    role: cred.role,
    displayName: cred.displayName,
    orgName: cred.orgName,
  });
}

// ---- Role helpers ----
export function isAdmin(session: AuthSession | null): boolean {
  return session?.role === 'admin';
}

export function getDefaultDashboard(role: AuthRole): string {
  switch (role) {
    case 'admin':    return '/dashboard/admin';
    case 'provider': return '/dashboard/provider';
    case 'consumer': return '/dashboard/consumer';
  }
}
