'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  validateCredentials, getSession, DEMO_CREDENTIALS,
  type AuthRole, getDefaultDashboard,
} from '@/lib/auth';

const ROLE_CONFIG: Record<AuthRole, {
  label: string; icon: string; color: string;
  email: string; password: string; desc: string;
}> = {
  admin: {
    label: 'Admin', icon: '🛡️', color: '#f87171',
    email: 'admin@greenmesh.io', password: 'GreenMesh@2026',
    desc: 'Platform administration & fraud monitoring',
  },
  provider: {
    label: 'Provider', icon: '🖥️', color: '#00ff88',
    email: 'habib@techbd.io', password: 'Provider@123',
    desc: 'Manage your GPU nodes & earnings',
  },
  consumer: {
    label: 'Consumer', icon: '🚀', color: '#00d4ff',
    email: 'rahul@buet.ac.bd', password: 'Consumer@123',
    desc: 'Run AI workloads on distributed GPUs',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<AuthRole>('consumer');
  const [email, setEmail] = useState('rahul@buet.ac.bd');
  const [password, setPassword] = useState('Consumer@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace(getDefaultDashboard(session.role));
    }
  }, [router]);

  function selectRole(role: AuthRole) {
    setSelectedRole(role);
    const cfg = ROLE_CONFIG[role];
    setEmail(cfg.email);
    setPassword(cfg.password);
    setError('');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // realistic delay

    const session = validateCredentials(email.trim(), password);
    if (!session) {
      setError('Invalid credentials. Use the demo credentials shown below.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    await new Promise(r => setTimeout(r, 1000));
    router.push(getDefaultDashboard(session.role));
  }

  const cfg = ROLE_CONFIG[selectedRole];

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg-base)',
      }}>
        <div style={{ textAlign: 'center', animation: 'fadeInUp 0.5s ease' }}>
          <div style={{ fontSize: '5rem', marginBottom: 20 }}>✅</div>
          <h2 className="gradient-text">Welcome back!</h2>
          <p style={{ marginTop: 8 }}>Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar__logo">
          <div className="navbar__logo-icon">⚡</div>
          <span className="gradient-text">GreenMesh</span>
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/marketplace" className="btn btn-secondary btn-sm">Browse Marketplace</Link>
          <Link href="/guidelines" className="btn btn-secondary btn-sm">📖 Guidelines</Link>
        </div>
      </nav>

      <main style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px',
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg, var(--color-accent-green), var(--color-accent-cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(0,255,136,0.3)',
            }}>⚡</div>
            <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Sign In to <span className="gradient-text">GreenMesh</span></h1>
            <p>AI-powered distributed GPU compute marketplace</p>
          </div>

          {/* Role Selector */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 28,
          }}>
            {(Object.entries(ROLE_CONFIG) as [AuthRole, typeof cfg][]).map(([role, rc]) => (
              <button
                key={role}
                onClick={() => selectRole(role)}
                style={{
                  padding: '12px 8px', borderRadius: 12, border: `1.5px solid`,
                  borderColor: selectedRole === role ? rc.color : 'rgba(255,255,255,0.07)',
                  background: selectedRole === role ? `${rc.color}10` : 'rgba(255,255,255,0.03)',
                  color: selectedRole === role ? rc.color : 'var(--color-text-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  boxShadow: selectedRole === role ? `0 0 16px ${rc.color}20` : 'none',
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{rc.icon}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{rc.label}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.3 }}>{rc.desc}</span>
              </button>
            ))}
          </div>

          {/* Login Card */}
          <div className="glass-card" style={{ padding: 32 }}>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Demo hint */}
              <div style={{
                background: `${cfg.color}08`, border: `1px solid ${cfg.color}25`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ fontSize: '0.75rem', color: cfg.color, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {cfg.icon} Demo Credentials — {cfg.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Email</span>
                    <code style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{cfg.email}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Password</span>
                    <code style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{cfg.password}</code>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(x => !x)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--color-text-muted)',
                      cursor: 'pointer', fontSize: '1rem',
                    }}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, padding: '10px 14px', fontSize: '0.84rem', color: '#f87171',
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: '100%', justifyContent: 'center', padding: 14,
                  opacity: loading ? 0.7 : 1, fontSize: '0.95rem',
                  background: loading
                    ? 'rgba(255,255,255,0.08)'
                    : `linear-gradient(135deg, ${cfg.color === '#00ff88' ? '#00ff88' : cfg.color}, var(--color-accent-cyan))`,
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="login-spinner" />
                    Authenticating...
                  </span>
                ) : (
                  `${cfg.icon} Sign in as ${cfg.label}`
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="sep" style={{ margin: '20px 0' }}>OR</div>

            {/* Quick fill buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 4 }}>
                Quick fill demo account:
              </p>
              {(Object.entries(ROLE_CONFIG) as [AuthRole, typeof cfg][]).map(([role, rc]) => (
                <button
                  key={role}
                  onClick={() => selectRole(role)}
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', gap: 10, border: `1px solid ${rc.color}25` }}
                >
                  <span>{rc.icon}</span>
                  <span style={{ color: rc.color, fontWeight: 700 }}>{rc.label}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>{rc.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 20 }}>
            Don&apos;t have an account?{' '}
            <Link href="/onboard/provider" style={{ color: 'var(--color-accent-cyan)' }}>
              Become a Provider →
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
