'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MOCK_PROVIDERS, MOCK_GPU_NODES, MOCK_JOBS, generateTelemetry } from '@/lib/mockData';
import { computeTrustScore, getTrustLabel, checkNodeHealth, getPriceBand } from '@/lib/aiEngine';
import type { GPUTelemetry, HealthAlert } from '@/lib/types';

const PROVIDER = MOCK_PROVIDERS[2]; // Oslo HPC — most impressive
const MY_NODES = MOCK_GPU_NODES.filter(n => n.provider_id === PROVIDER.id);

function TrustRingLarge({ score }: { score: number }) {
  const size = 120;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const { color, label } = getTrustLabel(score);
  const fill = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease', filter: `drop-shadow(0 0 6px ${color}60)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', fontWeight: 700, marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
}

function MiniChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const h = 50, w = 200;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min + 0.001)) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <svg width={w} height={h} style={{ overflow: 'visible', display: 'block' }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`${color}15`} strokeWidth="0" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
        <span>60s ago</span>
        <span style={{ color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{data[data.length - 1]?.toFixed(1)}</span>
        <span>now</span>
      </div>
    </div>
  );
}

function NodeMonitorCard({ nodeId, nodeModel }: { nodeId: string; nodeModel: string }) {
  const [telemetry, setTelemetry] = useState<GPUTelemetry[]>(generateTelemetry(nodeId));
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const next = [...prev.slice(-59), {
          time: new Date().toISOString(),
          gpu_node_id: nodeId,
          temperature_c: prev[prev.length-1].temperature_c + (Math.random() - 0.5) * 3,
          vram_used_gb: Math.max(0, prev[prev.length-1].vram_used_gb + (Math.random() - 0.5) * 2),
          power_draw_w: Math.max(100, prev[prev.length-1].power_draw_w + (Math.random() - 0.5) * 20),
          fan_speed_pct: Math.min(100, Math.max(20, prev[prev.length-1].fan_speed_pct + (Math.random() - 0.5) * 5)),
          utilization_pct: Math.min(100, Math.max(0, prev[prev.length-1].utilization_pct + (Math.random() - 0.5) * 8)),
        }];
        setAlerts(checkNodeHealth(nodeId, next.slice(-6)));
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [nodeId]);

  const latest = telemetry[telemetry.length - 1];
  const node = MOCK_GPU_NODES.find(n => n.id === nodeId);

  const statusColor = node?.status === 'idle' ? '#00ff88' : node?.status === 'busy' ? '#f59e0b' : '#ef4444';

  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{nodeModel}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{node?.vram_gb}GB VRAM · {node?.driver_version}</div>
        </div>
        <span style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30`, padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
          ● {node?.status?.toUpperCase()}
        </span>
      </div>

      {/* Live metrics */}
      <div className="grid-2" style={{ gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Temp', value: `${latest?.temperature_c?.toFixed(1)}°C`, color: latest?.temperature_c > 80 ? '#ef4444' : '#00ff88' },
          { label: 'Power', value: `${latest?.power_draw_w?.toFixed(0)}W`, color: '#f59e0b' },
          { label: 'VRAM', value: `${latest?.vram_used_gb?.toFixed(1)}/${node?.vram_gb}GB`, color: '#00d4ff' },
          { label: 'Util', value: `${latest?.utilization_pct?.toFixed(0)}%`, color: '#a78bfa' },
        ].map(m => (
          <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: m.color, fontFamily: 'var(--font-mono)' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 8 }}>
        <MiniChart data={telemetry.slice(-30).map(t => t.temperature_c)} color="#f59e0b" label="Temperature (°C)" />
        <MiniChart data={telemetry.slice(-30).map(t => t.utilization_pct)} color="#00d4ff" label="Utilization (%)" />
      </div>

      {alerts.length > 0 && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ fontSize: '0.75rem', color: a.severity === 'critical' ? '#f87171' : '#fbbf24', fontWeight: 600 }}>
              ⚠️ {a.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'earnings' | 'trust'>('overview');

  const { color: trustColor, label: trustLabel } = getTrustLabel(PROVIDER.trust_score);

  const myJobs = MOCK_JOBS.filter(j => {
    const node = MOCK_GPU_NODES.find(n => n.id === j.gpu_node_id);
    return node?.provider_id === PROVIDER.id;
  });

  const priceBand = getPriceBand('ultra', 5, 8);

  const trustBreakdown = {
    uptime_pct: PROVIDER.uptime_pct,
    job_success_rate: PROVIDER.job_success_rate,
    avg_review_score: PROVIDER.avg_review_score,
    disconnect_rate: PROVIDER.disconnect_rate,
  };
  const computedTrust = computeTrustScore(trustBreakdown);

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div style={{ padding: '12px 16px 24px' }}>
          <Link href="/" className="navbar__logo" style={{ textDecoration: 'none' }}>
            <div className="navbar__logo-icon">⚡</div>
            <span className="gradient-text" style={{ fontSize: '1rem' }}>GreenMesh</span>
          </Link>
        </div>
        <span className="sidebar__section-label">Provider</span>
        {[
          { label: '📊 Overview',    tab: 'overview'  },
          { label: '🖥️ My Nodes',   tab: 'nodes'     },
          { label: '💰 Earnings',   tab: 'earnings'  },
          { label: '🛡️ Trust Score',tab: 'trust'     },
        ].map(item => (
          <button key={item.tab} onClick={() => setActiveTab(item.tab as typeof activeTab)}
            className={`sidebar__item ${activeTab === item.tab ? 'active' : ''}`}>
            {item.label}
          </button>
        ))}
        <div className="divider" />
        <span className="sidebar__section-label">Switch View</span>
        <Link href="/dashboard/consumer" className="sidebar__item">👤 Consumer View</Link>
        <Link href="/dashboard/admin"    className="sidebar__item">🛡️ Admin Panel</Link>
        <Link href="/marketplace"        className="sidebar__item">🖥️ Marketplace</Link>
      </aside>

      <main className="main-content">
        <nav className="navbar" style={{ left: 0, position: 'sticky', top: 0, zIndex: 50 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Provider Dashboard</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '0.82rem', color: trustColor, fontWeight: 700 }}>🛡️ Trust: {PROVIDER.trust_score}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#00ff88' }}>
              <span className="pulse-dot" />
              {MY_NODES.filter(n => n.status !== 'offline').length} nodes online
            </span>
          </div>
        </nav>

        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div>
                <h1 style={{ fontSize: '2rem' }}>
                  <span className="gradient-text">{PROVIDER.display_name}</span>
                </h1>
                <p>{PROVIDER.location_city}, {PROVIDER.location_country} · Verified Provider ✓</p>
              </div>
              <TrustRingLarge score={PROVIDER.trust_score} />
            </div>

            <div className="grid-4" style={{ marginBottom: 32 }}>
              {[
                { label: 'Earnings Today',  value: `৳${earnings.today.toLocaleString()}`,      sub: 'H100 + A100',  color: '#00ff88', icon: '💰' },
                { label: 'This Month',      value: `৳${earnings.this_month.toLocaleString()}`,  sub: 'all nodes',    color: '#00d4ff', icon: '📅' },
                { label: 'Total Jobs',      value: '890',     sub: 'hosted',       color: '#a78bfa', icon: '🚀' },
                { label: 'Success Rate',    value: '99%',     sub: 'job completion',color: '#4ade80', icon: '✅' },
              ].map(s => (
                <div key={s.label} className="glass-card stat-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="stat-card__label">{s.label}</span>
                    <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  </div>
                  <span className="stat-card__value mono" style={{ color: s.color }}>{s.value}</span>
                  <span className="stat-card__sub">{s.sub}</span>
                </div>
              ))}
            </div>

            {/* AI Pricing recommendation */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 24, border: '1px solid rgba(0,255,136,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    🧠 AI Pricing Recommendation
                  </span>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 6 }}>
                    Current demand is high ({priceBand.demand_multiplier.toFixed(2)}x multiplier). Consider adjusting pricing.
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Recommended price band</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: '#00ff88' }}>
                    ${priceBand.floor}–${priceBand.ceiling}/hr
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#00d4ff' }}>Suggested: ${priceBand.recommended}/hr</div>
                </div>
              </div>
            </div>

            {/* Node status quick view */}
            <h3 style={{ marginBottom: 16 }}>Node Status</h3>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead><tr><th>Node</th><th>VRAM</th><th>Status</th><th>Price</th><th>Benchmark</th><th>Carbon</th></tr></thead>
                <tbody>
                  {MY_NODES.map(n => (
                    <tr key={n.id}>
                      <td>{n.gpu_model}</td>
                      <td>{n.vram_gb}GB</td>
                      <td><span className={`badge badge-${n.status === 'idle' ? 'online' : n.status}`}>{n.status}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#00ff88' }}>${n.hourly_price}/hr</td>
                      <td>{n.benchmark_score.toFixed(1)}/100</td>
                      <td style={{ color: '#4ade80' }}>{n.carbon_intensity_gco2_kwh} gCO₂</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'nodes' && (
          <>
            <div className="page-header">
              <h1>Live <span className="gradient-text">Node Monitoring</span></h1>
              <p>Real-time GPU telemetry · Health alerts · Auto-threshold detection</p>
            </div>
            <div className="grid-2">
              {MY_NODES.map(node => (
                <NodeMonitorCard key={node.id} nodeId={node.id} nodeModel={node.gpu_model} />
              ))}
            </div>
          </>
        )}

        {activeTab === 'earnings' && (
          <>
            <div className="page-header">
              <h1><span className="gradient-text">Earnings</span></h1>
              <p>Revenue from all hosted GPU jobs</p>
            </div>
            <div className="grid-4" style={{ marginBottom: 32 }}>
              {[
                { label: 'Today',     value: `৳${earnings.today.toLocaleString()}`,       color: '#00ff88' },
                { label: 'This Week', value: `৳${earnings.this_week.toLocaleString()}`,   color: '#00d4ff' },
                { label: 'This Month',value: `৳${earnings.this_month.toLocaleString()}`, color: '#a78bfa' },
                { label: 'All Time',  value: `৳${earnings.all_time.toLocaleString()}`,   color: '#f59e0b' },
              ].map(e => (
                <div key={e.label} className="glass-card stat-card">
                  <span className="stat-card__label">{e.label}</span>
                  <span className="stat-card__value mono" style={{ color: e.color }}>{e.value}</span>
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h4>Pending Payout</h4>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem', color: '#00ff88' }}>৳{earnings.pending_payout.toLocaleString()}</span>
              </div>
              <div style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 10, padding: 16 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  ✅ Payout scheduled for Friday. Funds are held in escrow until job completion is confirmed.
                  Platform fee: <strong style={{ color: 'var(--color-accent-cyan)' }}>12%</strong>
                </p>
              </div>
              <h4 style={{ marginTop: 24, marginBottom: 12 }}>Recent Jobs Hosted</h4>
              <table className="data-table">
                <thead><tr><th>Job</th><th>Consumer</th><th>Duration</th><th>Payout</th><th>Status</th></tr></thead>
                <tbody>
                  {myJobs.map(j => (
                    <tr key={j.id}>
                      <td><span className="mono" style={{ fontSize: '0.75rem' }}>#{j.id.slice(-6)}</span></td>
                      <td>{j.consumer_id.slice(-8)}</td>
                      <td>{j.runtime_minutes ? `${j.runtime_minutes}min` : 'ongoing'}</td>
                      <td style={{ color: '#00ff88', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        ${((j.actual_cost ?? j.estimated_cost ?? 0) * 0.88).toFixed(2)}
                      </td>
                      <td><span className={`badge badge-${j.status === 'completed' ? 'completed' : j.status === 'running' ? 'running' : 'queued'}`}>{j.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'trust' && (
          <>
            <div className="page-header">
              <h1>🛡️ Trust <span className="gradient-text">Score</span></h1>
              <p>AI-computed provider trust based on uptime, success rate, reviews, and reliability</p>
            </div>
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minWidth: 220 }}>
                <TrustRingLarge score={computedTrust} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: trustColor }}>{trustLabel}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Recalculated after each job</div>
                </div>
              </div>
              <div className="glass-card" style={{ padding: 24, flex: 1 }}>
                <h4 style={{ marginBottom: 20 }}>Trust Score Formula (§6.6)</h4>
                <code style={{ display: 'block', background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 10, fontSize: '0.8rem', color: '#a78bfa', marginBottom: 20, fontFamily: 'var(--font-mono)', lineHeight: 1.8 }}>
                  trust = 100 × (0.4×uptime + 0.3×success + 0.2×review + 0.1×reliability)
                </code>
                {[
                  { label: 'Uptime %',           value: PROVIDER.uptime_pct,               weight: '40%', score: PROVIDER.uptime_pct * 0.4,         color: '#00ff88' },
                  { label: 'Job Success Rate',   value: PROVIDER.job_success_rate * 100,   weight: '30%', score: PROVIDER.job_success_rate * 30,      color: '#00d4ff' },
                  { label: 'Avg Review (1-5)',   value: PROVIDER.avg_review_score,         weight: '20%', score: ((PROVIDER.avg_review_score - 1) / 4) * 20, color: '#a78bfa' },
                  { label: 'Reliability (1-disconnect)', value: (1 - PROVIDER.disconnect_rate) * 100, weight: '10%', score: (1 - PROVIDER.disconnect_rate) * 10, color: '#f59e0b' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{f.label}</span>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Weight: {f.weight}</span>
                        <span style={{ color: f.color, fontWeight: 700 }}>→ {f.score.toFixed(1)}pts</span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${f.value}%`, background: f.color }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      Raw: {f.value.toFixed(1)}{f.label.includes('%') || f.label.includes('Rel') ? '' : ''}
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>Final Trust Score</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.2rem', color: trustColor }}>{computedTrust.toFixed(1)}/100</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
