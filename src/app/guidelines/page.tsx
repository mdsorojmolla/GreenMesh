'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { GPU_CATALOG, CARBON_REGIONS } from '@/lib/mockData';

// Earnings calculator
function EarningsCalc() {
  const [gpuIdx, setGpuIdx] = useState(0);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [utilization, setUtilization] = useState(70);

  const gpu = GPU_CATALOG[gpuIdx];
  const effectiveHours = hoursPerDay * (utilization / 100);
  const dailyGross = gpu.base_price * effectiveHours;
  const platformFee = dailyGross * 0.12;
  const dailyNet = dailyGross - platformFee;
  const monthlyNet = dailyNet * 30;
  const yearlyNet = dailyNet * 365;

  return (
    <div className="glass-card" style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: '1.5rem' }}>🧮</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Earnings Calculator</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Estimate your monthly GPU revenue</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">GPU Model</label>
          <select className="select" value={gpuIdx} onChange={e => setGpuIdx(+e.target.value)}>
            {GPU_CATALOG.map((g, i) => (
              <option key={g.model} value={i}>{g.model} ({g.vram_gb}GB)</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Hours Available / Day: <strong style={{ color: 'var(--color-accent-cyan)' }}>{hoursPerDay}h</strong></label>
          <input type="range" min={1} max={24} value={hoursPerDay}
            onChange={e => setHoursPerDay(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--color-accent-cyan)', marginTop: 10 }} />
        </div>
        <div className="form-group">
          <label className="form-label">Expected Utilization: <strong style={{ color: '#a78bfa' }}>{utilization}%</strong></label>
          <input type="range" min={10} max={100} step={5} value={utilization}
            onChange={e => setUtilization(+e.target.value)}
            style={{ width: '100%', accentColor: '#a78bfa', marginTop: 10 }} />
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>GPU Base Rate</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.3rem', color: '#00ff88' }}>
            ৳{gpu.base_price}/hr
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{gpu.tier.toUpperCase()} tier · {gpu.tflops} TFLOPS</div>
        </div>
      </div>

      <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { label: 'Daily Earnings', value: `৳${dailyNet.toFixed(0)}`, sub: 'after 12% fee', color: '#4ade80' },
            { label: 'Monthly Earnings', value: `৳${monthlyNet.toFixed(0)}`, sub: '30 days', color: '#00ff88' },
            { label: 'Annual Estimate', value: `৳${(yearlyNet / 1000).toFixed(0)}K`, sub: '365 days', color: '#00d4ff' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.5rem', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Effective compute hours: {effectiveHours.toFixed(1)}h/day · Gross: ৳{dailyGross.toFixed(0)}/day · Platform fee: ৳{platformFee.toFixed(0)}/day
        </div>
      </div>
    </div>
  );
}

function Section({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
        }}>{icon}</div>
        <h2 style={{ fontSize: '1.6rem', letterSpacing: '-0.02em' }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Req({ icon, label, value, ok }: { icon: string; label: string; value: string; ok: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
      background: ok ? 'rgba(0,255,136,0.04)' : 'rgba(239,68,68,0.04)',
      border: `1px solid ${ok ? 'rgba(0,255,136,0.15)' : 'rgba(239,68,68,0.15)'}`,
      borderRadius: 10,
    }}>
      <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 1 }}>{value}</div>
      </div>
      <span style={{
        fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999,
        background: ok ? 'rgba(0,255,136,0.12)' : 'rgba(239,68,68,0.12)',
        color: ok ? '#00ff88' : '#f87171',
        border: `1px solid ${ok ? 'rgba(0,255,136,0.25)' : 'rgba(239,68,68,0.25)'}`,
      }}>
        {ok ? '✓ Required' : '✗ Disqualifying'}
      </span>
    </div>
  );
}

function Step({ num, title, desc, detail }: { num: number; title: string; desc: string; detail?: string }) {
  return (
    <div style={{ display: 'flex', gap: 20, paddingBottom: 32, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-accent-green), var(--color-accent-cyan))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '1.1rem', color: '#080b14', flexShrink: 0,
        }}>{num}</div>
        {num < 6 && <div style={{ width: 2, flex: 1, background: 'rgba(0,255,136,0.15)', marginTop: 8 }} />}
      </div>
      <div style={{ paddingTop: 10, flex: 1, paddingBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: detail ? 10 : 0 }}>{desc}</div>
        {detail && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#00ff88', background: 'rgba(0,0,0,0.3)', padding: '8px 14px', borderRadius: 8, marginTop: 8 }}>
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <button
        onClick={() => setOpen(x => !x)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '16px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', color: 'var(--color-text-primary)', fontSize: '0.95rem', fontWeight: 600,
        }}
      >
        {q}
        <span style={{
          fontSize: '0.8rem', color: 'var(--color-accent-cyan)',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
        }}>▼</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 16, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
}

const NAV_SECTIONS = [
  { id: 'overview',      label: 'Overview' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'setup',        label: 'Setup Guide' },
  { id: 'security',     label: 'Security' },
  { id: 'earnings',     label: 'Earnings' },
  { id: 'policy',       label: 'Usage Policy' },
  { id: 'sla',          label: 'SLA & Trust' },
  { id: 'faq',          label: 'FAQ' },
  { id: 'legal',        label: 'Legal' },
];

export default function GuidelinesPage() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar__logo">
          <div className="navbar__logo-icon">⚡</div>
          <span className="gradient-text">GreenMesh</span>
        </Link>
        <ul className="navbar__links">
          <li><Link href="/marketplace">Marketplace</Link></li>
          <li><Link href="/guidelines" style={{ color: 'var(--color-accent-green)' }}>Guidelines</Link></li>
          <li><Link href="/vgpu">vGPU Terminal</Link></li>
        </ul>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" className="btn btn-secondary btn-sm">Log In</Link>
          <Link href="/onboard/provider" className="btn btn-primary btn-sm">Become a Provider →</Link>
        </div>
      </nav>

      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: 72 }}>
        {/* Sticky sidebar TOC */}
        <aside style={{
          width: 220, flexShrink: 0, position: 'sticky', top: 72, alignSelf: 'flex-start',
          padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 4,
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, paddingLeft: 12 }}>
            On This Page
          </div>
          {NAV_SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: 'block', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem',
                fontWeight: activeSection === s.id ? 700 : 400,
                color: activeSection === s.id ? 'var(--color-accent-green)' : 'var(--color-text-secondary)',
                background: activeSection === s.id ? 'rgba(0,255,136,0.08)' : 'transparent',
                borderLeft: `2px solid ${activeSection === s.id ? 'var(--color-accent-green)' : 'transparent'}`,
                textDecoration: 'none', transition: 'all 0.15s',
              }}>
              {s.label}
            </a>
          ))}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, maxWidth: 860, padding: '40px 48px 120px' }}>
          {/* Hero */}
          <div style={{ marginBottom: 56 }}>
            <span className="tag tag-green" style={{ marginBottom: 16, display: 'inline-block' }}>📖 Provider Documentation</span>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 16 }}>
              GPU Sharing <span className="gradient-text">Guidelines</span>
            </h1>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 640 }}>
              Everything you need to know to share your idle GPU on GreenMesh — from hardware requirements to
              payouts, security guarantees, and legal compliance.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <Link href="/onboard/provider" className="btn btn-primary">🚀 Get Started Now</Link>
              <Link href="/vgpu" className="btn btn-secondary">💻 Try vGPU Terminal</Link>
            </div>
          </div>

          {/* Overview */}
          <Section id="overview" icon="🌐" title="Overview">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                { icon: '💰', title: 'Earn Passively', desc: 'Your idle GPU earns BDT every hour it runs a job. Set your price and we handle everything else.' },
                { icon: '🔒', title: 'Fully Sandboxed', desc: 'Consumer code runs in an isolated Docker + gVisor container. Your filesystem and network are never accessible.' },
                { icon: '🧠', title: 'AI-Matched', desc: 'Our scheduler matches jobs to your GPU based on VRAM, latency, carbon intensity, and trust score.' },
                { icon: '🌿', title: 'Carbon-Aware', desc: 'GreenMesh tracks your grid\'s carbon intensity and routes eco-conscious jobs to greener providers first.' },
              ].map(c => (
                <div key={c.title} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{c.icon}</div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{c.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-accent-cyan)', marginBottom: 8 }}>ℹ️ Who is GreenMesh for?</div>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>
                GreenMesh is designed for individuals, universities, and small organizations in Bangladesh and globally
                who own NVIDIA or AMD GPUs and want to monetize idle compute capacity. Whether you have one RTX 3060
                at home or an entire lab of H100s, you can participate.
              </p>
            </div>
          </Section>

          {/* Requirements */}
          <Section id="requirements" icon="⚙️" title="Hardware Requirements">
            <p style={{ marginBottom: 24, lineHeight: 1.7 }}>
              Your GPU must meet the following minimum specifications to be listed on GreenMesh. Hardware is
              automatically verified during onboarding via a standardized benchmark job.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              <Req icon="💾" label="Minimum VRAM" value="8GB GDDR6 or better (RTX 3070, 3060, etc.)" ok={true} />
              <Req icon="🔧" label="CUDA Capability" value="NVIDIA CUDA ≥ 7.5 OR AMD ROCm ≥ 5.0" ok={true} />
              <Req icon="🖥️" label="Operating System" value="Ubuntu 20.04+ / Windows 11 with WSL2 / Debian 11+" ok={true} />
              <Req icon="🌐" label="Internet Connection" value="≥ 25 Mbps stable upload (fiber or cable preferred)" ok={true} />
              <Req icon="⚡" label="Power Supply" value="Stable UPS-backed power recommended for uptime score" ok={true} />
              <Req icon="🧩" label="Driver Version" value="NVIDIA Driver ≥ 525.x or AMD ROCm ≥ 5.4" ok={true} />
              <Req icon="🚫" label="Mining or Overclocking" value="GPUs in active mining rigs or with aggressive OC profiles are rejected" ok={false} />
              <Req icon="🚫" label="Consumer-modified BIOSes" value="GPUs with flashed mining BIOSes are disqualified by benchmark" ok={false} />
            </div>

            <h3 style={{ marginBottom: 16 }}>GPU Tier Reference</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Model</th><th>VRAM</th><th>TFLOPS</th><th>Tier</th><th>Base Rate</th></tr>
                </thead>
                <tbody>
                  {GPU_CATALOG.map(g => (
                    <tr key={g.model}>
                      <td style={{ fontWeight: 600 }}>{g.model}</td>
                      <td>{g.vram_gb}GB</td>
                      <td>{g.tflops}</td>
                      <td>
                        <span className={`badge badge-${g.tier === 'titan' ? 'running' : g.tier === 'ultra' ? 'completed' : g.tier === 'high' ? 'scheduled' : 'queued'}`}>
                          {g.tier.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#00ff88', fontWeight: 700 }}>৳{g.base_price}/hr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Setup Guide */}
          <Section id="setup" icon="🚀" title="Step-by-Step Setup Guide">
            <Step num={1} title="Create Your Provider Account"
              desc="Sign up at greenmesh.io with your email. Verify your email address. Select 'Provider' as your account type and fill in your display name, location, and payout preferences."
            />
            <Step num={2} title="Install the GreenMesh Agent"
              desc="The lightweight agent (< 50MB) runs on your machine and manages job sandboxing, resource limits, and heartbeat reporting. It never reads your files."
              detail="curl -sSL https://agent.greenmesh.io/install.sh | bash"
            />
            <Step num={3} title="Register Your GPU Hardware"
              desc="Select your GPU model from the catalog. The system auto-detects your VRAM, driver version, and CUDA capability. You can register up to 8 nodes per account."
            />
            <Step num={4} title="Complete GPU Benchmark Verification"
              desc="A standardized benchmark job (~5 minutes) runs to verify your claimed specs. Results are recorded in your trust profile. Significant spec mismatches result in rejection."
            />
            <Step num={5} title="Set Your Price"
              desc="Our AI Pricing Engine suggests a competitive rate based on current supply/demand and your GPU tier. You can set any price within the floor–ceiling band for your tier."
            />
            <Step num={6} title="Go Live & Earn"
              desc="Once verified, your GPU appears in the marketplace. The agent runs in the background. Jobs are automatically allocated, sandboxed, and billed. Weekly payouts via bKash, Nagad, or bank transfer."
            />
          </Section>

          {/* Security */}
          <Section id="security" icon="🔒" title="Security & Privacy">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  icon: '🐳', title: 'Docker + gVisor Sandboxing',
                  desc: 'Every consumer job runs inside a Docker container with gVisor (runsc) as the runtime. gVisor is a user-space kernel that intercepts all system calls, preventing any access to the host system.'
                },
                {
                  icon: '🌐', title: 'Network Isolation',
                  desc: 'Containers have no access to your local network. They can only reach designated GreenMesh I/O endpoints (result upload, checkpoint storage). Outbound connections to arbitrary IPs are blocked.'
                },
                {
                  icon: '📁', title: 'Filesystem Isolation',
                  desc: 'Consumer containers mount only their designated /workspace volume. Your host filesystem (including home directories, system files, and other drives) is completely inaccessible.'
                },
                {
                  icon: '🔑', title: 'Resource Limits',
                  desc: 'cgroup v2 enforces strict CPU, RAM, disk I/O, and GPU memory limits per job. A consumer cannot consume more than their requested VRAM allocation even if more is physically available.'
                },
                {
                  icon: '🛡️', title: 'Benchmark-Based Fraud Detection',
                  desc: 'After every job batch, a spot-check benchmark verifies your GPU spec hasn\'t changed. If measured performance drops > 20%, an alert is raised and your trust score is investigated.'
                },
                {
                  icon: '🔍', title: 'What We Monitor (Telemetry)',
                  desc: 'GreenMesh agent sends: GPU temperature, power draw, utilization %, VRAM usage, and node heartbeat. We never read process memory, disk contents, or network traffic payload.'
                },
              ].map(c => (
                <div key={c.title} className="glass-card" style={{ padding: 20, display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0, marginTop: 2 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: 8 }}>🔐 Security Incident Response</div>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>
                If you suspect a security incident (unexpected resource usage, unusual network traffic, or strange process activity),
                immediately stop the GreenMesh agent (<code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: 4 }}>systemctl stop greenmesh-agent</code>)
                and contact <strong style={{ color: '#a78bfa' }}>security@greenmesh.io</strong>. All incidents are investigated within 24 hours.
              </p>
            </div>
          </Section>

          {/* Earnings Calculator */}
          <Section id="earnings" icon="💰" title="Earnings & Payouts">
            <EarningsCalc />
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: '📅', title: 'Weekly Payouts', desc: 'Earnings are released every Friday. Funds are held in escrow until the consumer confirms job completion or 72 hours elapse.' },
                { icon: '💸', title: 'Payout Methods', desc: 'bKash, Nagad, Rocket (Bangladesh), SWIFT bank transfer (international). Minimum payout: ৳500.' },
                { icon: '📊', title: 'Platform Fee', desc: '12% of gross earnings covers infrastructure, payment processing, fraud detection, and 24/7 support.' },
                { icon: '💡', title: 'Tax Note', desc: 'Providers are responsible for declaring GPU rental income under Bangladeshi income tax rules. GreenMesh provides monthly income statements.' },
              ].map(c => (
                <div key={c.title} className="glass-card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{c.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{c.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Usage Policy */}
          <Section id="policy" icon="📋" title="Usage Policy & Fair Use">
            <p style={{ marginBottom: 20, lineHeight: 1.7 }}>
              By listing your GPU on GreenMesh, you agree to the Provider Usage Policy. Violations result in trust score penalties, temporary suspension, or permanent ban.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { type: 'allowed', icon: '✅', title: 'Allowed', items: [
                  'AI/ML training and inference workloads',
                  'Scientific computing and simulations',
                  'Video rendering and 3D processing',
                  'Data processing and ETL pipelines',
                  'Software build and CI/CD jobs',
                  'Research and academic compute',
                ]},
                { type: 'prohibited', icon: '🚫', title: 'Prohibited Workloads', items: [
                  'Cryptocurrency mining (auto-detected and banned)',
                  'Any illegal content generation or processing',
                  'DDoS attacks or network scanning',
                  'Password cracking or brute-force attacks',
                  'Malware compilation or distribution',
                  'Circumventing sandbox isolation in any way',
                ]},
              ].map(group => (
                <div key={group.type} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{group.icon}</span> {group.title}
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {group.items.map(item => (
                      <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                        <span style={{ color: group.type === 'allowed' ? '#00ff88' : '#f87171', flexShrink: 0, marginTop: 1 }}>
                          {group.type === 'allowed' ? '◆' : '✕'}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* SLA */}
          <Section id="sla" icon="📈" title="SLA & Trust Score">
            <p style={{ marginBottom: 20, lineHeight: 1.7 }}>
              Your <strong>Trust Score</strong> (0–100) is the most important number on your provider profile.
              It determines your ranking in the AI Scheduler, your visibility to consumers, and your ability to command premium pricing.
            </p>
            <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#a78bfa', marginBottom: 16, background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: 10, lineHeight: 1.8 }}>
                Trust = 100 × (0.4×uptime + 0.3×success_rate + 0.2×review_score + 0.1×reliability)
              </div>
              {[
                { factor: 'Uptime (40%)', desc: 'Percentage of registered hours your node was online and reachable. Target: ≥ 95%.' },
                { factor: 'Job Success Rate (30%)', desc: 'Fraction of allocated jobs completed without error or crash. Target: ≥ 90%.' },
                { factor: 'Review Score (20%)', desc: 'Average consumer rating (1–5 stars) across all completed jobs. Target: ≥ 4.0.' },
                { factor: 'Reliability (10%)', desc: 'Inverse of disconnect rate during active jobs. Frequent mid-job disconnects heavily penalize this.' },
              ].map(f => (
                <div key={f.factor} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#00ff88', fontWeight: 700, minWidth: 180, fontSize: '0.88rem' }}>{f.factor}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{f.desc}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
              {[
                { label: 'Exceptional', range: '90–100', color: '#00ff88' },
                { label: 'Trusted', range: '80–89', color: '#22c55e' },
                { label: 'Good', range: '65–79', color: '#a3e635' },
                { label: 'Fair', range: '50–64', color: '#f59e0b' },
                { label: 'Low Trust', range: '0–49', color: '#ef4444' },
              ].map(t => (
                <div key={t.label} style={{ textAlign: 'center', background: `${t.color}0d`, border: `1px solid ${t.color}30`, borderRadius: 10, padding: '12px 8px' }}>
                  <div style={{ fontWeight: 800, color: t.color, fontSize: '0.85rem' }}>{t.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{t.range}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* FAQ */}
          <Section id="faq" icon="❓" title="Frequently Asked Questions">
            <div className="glass-card" style={{ padding: '8px 24px' }}>
              {[
                { q: 'Will my electricity bills increase significantly?', a: 'A high-end GPU like an RTX 4090 draws ~350W under full load. Running 8 hours/day adds roughly 2.8 kWh/day. At Bangladesh grid rates (~৳9–12/kWh), that\'s ৳25–34/day in electricity costs vs ৳1,000+ in earnings — a very favorable ratio.' },
                { q: 'Can consumers access my personal files or passwords?', a: 'No. The gVisor sandbox completely prevents access to your host filesystem. Consumer containers only see their own isolated /workspace directory. Our security team regularly audits the sandbox configuration.' },
                { q: 'What happens if my internet goes down mid-job?', a: 'The GreenMesh platform detects the disconnect within 60 seconds and migrates the job (with the last saved checkpoint) to another available node. The consumer is not charged for lost time. Your trust score is slightly penalized for each disconnect but recovers as you complete jobs successfully.' },
                { q: 'Can I use my GPU while it\'s listed on GreenMesh?', a: 'Yes. Jobs only use the VRAM they request. You can set a "reserved VRAM" value to ensure some capacity is always available for your own use. If you need the full GPU, you can pause your node from the dashboard — it will finish any active job first.' },
                { q: 'How are disputes handled?', a: 'If a consumer reports that a job produced incorrect results, our audit team reviews the job logs. If the issue is traced to hardware fault (e.g., VRAM errors), the provider is not paid. If the issue is the consumer\'s code, payment is released normally.' },
                { q: 'Is there a minimum earnings requirement to get paid?', a: 'Yes, the minimum payout threshold is ৳500. Earnings accumulate week over week until the threshold is met. You can also request early payout for a small processing fee (৳50 flat).' },
                { q: 'Can I register multiple GPUs?', a: 'Yes. You can register up to 8 GPU nodes per provider account. Each node goes through independent benchmark verification and has its own status, pricing, and telemetry.' },
              ].map(f => <FAQ key={f.q} q={f.q} a={f.a} />)}
            </div>
          </Section>

          {/* Legal */}
          <Section id="legal" icon="⚖️" title="Legal & Compliance (Bangladesh)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  title: 'Income Declaration',
                  desc: 'GPU rental income in Bangladesh is taxable under the Income Tax Ordinance, 1984 (amended 2023). GreenMesh provides annual income statements to assist with TIN filing. Providers earning > ৳300,000/year should consult a tax professional.',
                  color: '#f59e0b',
                },
                {
                  title: 'ICT Act Compliance',
                  desc: 'All workloads on GreenMesh are monitored for compliance with the Bangladesh ICT Act 2006. Any workload found to violate national laws is immediately terminated and the consumer account is banned. Providers are not liable for consumer workload content as long as they maintain their hardware in good faith.',
                  color: '#00d4ff',
                },
                {
                  title: 'Data Protection',
                  desc: 'GreenMesh does not store consumer workload data or results beyond 72 hours of job completion. Providers\' telemetry data (GPU metrics) is retained for 90 days for trust score computation. Personal data is handled per the Bangladesh Data Protection Act provisions.',
                  color: '#a78bfa',
                },
                {
                  title: 'Export Controls',
                  desc: 'Providers must ensure their hardware is not subject to US export control regulations (EAR) that would prevent providing GPU compute to certain parties. H100 and A100 GPUs are subject to specific export restrictions.',
                  color: '#f87171',
                },
              ].map(c => (
                <div key={c.title} className="glass-card" style={{ padding: 20, borderLeft: `3px solid ${c.color}` }}>
                  <div style={{ fontWeight: 700, color: c.color, marginBottom: 8 }}>{c.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{c.desc}</div>
                </div>
              ))}
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                Last updated: July 2026 · For legal questions contact <strong style={{ color: 'var(--color-accent-cyan)' }}>legal@greenmesh.io</strong>
              </div>
            </div>
          </Section>
        </main>
      </div>
    </>
  );
}
