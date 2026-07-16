'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_FRAUD_ALERTS, MOCK_GPU_NODES, MOCK_PROVIDERS, MOCK_JOBS, MOCK_PLATFORM_STATS } from '@/lib/mockData';
import { getTrustLabel } from '@/lib/aiEngine';
import type { FraudAlert } from '@/lib/types';

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = {
    high:   { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'  },
    medium: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    low:    { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', border: 'rgba(74,222,128,0.25)' },
  }[severity] ?? { bg: 'rgba(255,255,255,0.05)', color: '#888', border: 'rgba(255,255,255,0.1)' };
  return (
    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {severity}
    </span>
  );
}

function AlertCard({ alert, onResolve }: { alert: FraudAlert; onResolve: (id: string) => void }) {
  const provider = MOCK_PROVIDERS.find(p => p.id === alert.provider_id);
  const node     = MOCK_GPU_NODES.find(n => n.id === alert.gpu_node_id);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card" style={{ marginBottom: 12, border: alert.severity === 'high' && !alert.resolved ? '1px solid rgba(239,68,68,0.3)' : undefined }}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <SeverityBadge severity={alert.severity} />
              <span className="chip">{alert.alert_type.replace(/_/g, ' ')}</span>
              {alert.resolved && <span className="badge badge-completed">RESOLVED</span>}
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
              {provider?.display_name ?? 'Unknown Provider'}
            </div>
            {node && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                {node.gpu_model} · {provider?.location_city}, {provider?.location_country}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {new Date(alert.created_at).toLocaleString()}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button onClick={() => setExpanded(x => !x)}
            className="btn btn-secondary btn-sm">
            {expanded ? '▲ Hide' : '▼ Details'}
          </button>
          {!alert.resolved && (
            <button onClick={() => onResolve(alert.id)} className="btn btn-sm" style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.25)' }}>
              ✓ Mark Resolved
            </button>
          )}
          {!alert.resolved && alert.severity === 'high' && (
            <button className="btn btn-danger btn-sm">🚫 Suspend Node</button>
          )}
        </div>

        {expanded && (
          <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Alert Details
            </div>
            {Object.entries(alert.details).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{k.replace(/_/g, ' ')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', fontWeight: 600 }}>{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'fraud' | 'nodes' | 'jobs'>('overview');
  const [alerts, setAlerts] = useState(MOCK_FRAUD_ALERTS);

  function resolveAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  }

  const openAlerts  = alerts.filter(a => !a.resolved);
  const highSeverity = openAlerts.filter(a => a.severity === 'high').length;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div style={{ padding: '12px 16px 24px' }}>
          <Link href="/" className="navbar__logo" style={{ textDecoration: 'none' }}>
            <div className="navbar__logo-icon">⚡</div>
            <span className="gradient-text" style={{ fontSize: '1rem' }}>GreenMesh</span>
          </Link>
        </div>
        <span className="sidebar__section-label">Admin Panel</span>
        {[
          { label: '📊 Overview',    tab: 'overview' },
          { label: `🚨 Fraud Alerts ${openAlerts.length > 0 ? `(${openAlerts.length})` : ''}`, tab: 'fraud' },
          { label: '🖥️ All Nodes',  tab: 'nodes'    },
          { label: '🚀 All Jobs',   tab: 'jobs'     },
        ].map(item => (
          <button key={item.tab} onClick={() => setActiveTab(item.tab as typeof activeTab)}
            className={`sidebar__item ${activeTab === item.tab ? 'active' : ''}`}
            style={item.tab === 'fraud' && openAlerts.length > 0 ? { color: '#f87171' } : undefined}>
            {item.label}
          </button>
        ))}
        <div className="divider" />
        <span className="sidebar__section-label">User Views</span>
        <Link href="/dashboard/consumer" className="sidebar__item">👤 Consumer</Link>
        <Link href="/dashboard/provider"  className="sidebar__item">🏗️ Provider</Link>
        <Link href="/marketplace"         className="sidebar__item">🖥️ Marketplace</Link>
      </aside>

      <main className="main-content">
        <nav className="navbar" style={{ left: 0, position: 'sticky', top: 0, zIndex: 50 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>🛡️ Admin Dashboard</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {highSeverity > 0 && (
              <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>
                🚨 {highSeverity} HIGH severity alert{highSeverity > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </nav>

        {activeTab === 'overview' && (
          <>
            <div className="page-header">
              <h1>Platform <span className="gradient-text">Overview</span></h1>
              <p>Real-time platform health and activity metrics</p>
            </div>
            <div className="grid-4" style={{ marginBottom: 32 }}>
              {[
                { label: 'Nodes Online',    value: MOCK_PLATFORM_STATS.total_nodes_online,   color: '#00ff88', icon: '🖥️' },
                { label: 'Jobs Running',    value: MOCK_PLATFORM_STATS.total_jobs_running,   color: '#00d4ff', icon: '🚀' },
                { label: 'Revenue Today',   value: `$${MOCK_PLATFORM_STATS.platform_revenue_today.toLocaleString()}`, color: '#a78bfa', icon: '💰' },
                { label: 'Open Alerts',     value: openAlerts.length, color: highSeverity > 0 ? '#f87171' : '#4ade80', icon: '🚨' },
              ].map(s => (
                <div key={s.label} className="glass-card stat-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="stat-card__label">{s.label}</span>
                    <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  </div>
                  <span className="stat-card__value mono" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Providers overview */}
            <h3 style={{ marginBottom: 16 }}>Providers</h3>
            <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 24 }}>
              <table className="data-table">
                <thead><tr><th>Provider</th><th>Location</th><th>Nodes</th><th>Trust</th><th>Jobs Hosted</th><th>Status</th></tr></thead>
                <tbody>
                  {MOCK_PROVIDERS.map(p => {
                    const nodeCount = MOCK_GPU_NODES.filter(n => n.provider_id === p.id).length;
                    const { color } = getTrustLabel(p.trust_score);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.display_name}</td>
                        <td>{p.location_city}, {p.location_country}</td>
                        <td>{nodeCount}</td>
                        <td style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.trust_score}</td>
                        <td>{p.total_jobs_hosted?.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${p.verified ? 'badge-completed' : 'badge-queued'}`}>
                            {p.verified ? '✓ Verified' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Platform health */}
            <h3 style={{ marginBottom: 16 }}>Platform Health</h3>
            <div className="grid-3">
              {[
                { label: 'Providers',            value: MOCK_PLATFORM_STATS.total_providers,     max: 50, color: '#00ff88' },
                { label: 'Consumers',            value: MOCK_PLATFORM_STATS.total_consumers,     max: 100, color: '#00d4ff' },
                { label: 'Jobs Completed Today', value: MOCK_PLATFORM_STATS.total_jobs_completed_today, max: 200, color: '#a78bfa' },
              ].map(m => (
                <div key={m.label} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{m.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: m.color }}>{m.value}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'fraud' && (
          <>
            <div className="page-header">
              <h1>🚨 Fraud <span className="gradient-text">Alerts</span></h1>
              <p>AI-powered fraud detection · Rule-based v0 engine · Auto-escalation on HIGH severity</p>
            </div>
            {highSeverity > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>🚨</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#f87171' }}>{highSeverity} high-severity alert{highSeverity > 1 ? 's' : ''} require immediate action</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    Nodes are automatically suspended pending manual review. Review and resolve or take action below.
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {['all', 'high', 'medium', 'low'].map(f => (
                <span key={f} className="chip" style={{ cursor: 'pointer' }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? alerts.length : alerts.filter(a => a.severity === f).length})
                </span>
              ))}
            </div>

            {alerts.map(alert => <AlertCard key={alert.id} alert={alert} onResolve={resolveAlert} />)}
          </>
        )}

        {activeTab === 'nodes' && (
          <>
            <div className="page-header">
              <h1>All <span className="gradient-text">GPU Nodes</span></h1>
              <p>{MOCK_GPU_NODES.length} nodes registered across {MOCK_PROVIDERS.length} providers</p>
            </div>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Node</th><th>Provider</th><th>VRAM</th><th>Status</th><th>Price</th><th>Benchmark</th><th>Carbon</th><th>Last Heartbeat</th></tr>
                </thead>
                <tbody>
                  {MOCK_GPU_NODES.map(n => {
                    const p = MOCK_PROVIDERS.find(pr => pr.id === n.provider_id);
                    return (
                      <tr key={n.id}>
                        <td style={{ fontWeight: 600 }}>{n.gpu_model}</td>
                        <td>{p?.display_name}</td>
                        <td>{n.vram_gb}GB</td>
                        <td><span className={`badge badge-${n.status === 'idle' ? 'online' : n.status}`}>{n.status}</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#00ff88' }}>৳{n.hourly_price}/hr</td>
                        <td>{n.benchmark_score.toFixed(1)}</td>
                        <td style={{ color: n.carbon_intensity_gco2_kwh < 100 ? '#4ade80' : n.carbon_intensity_gco2_kwh < 400 ? '#f59e0b' : '#ef4444' }}>
                          {n.carbon_intensity_gco2_kwh}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {new Date(n.last_heartbeat).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'jobs' && (
          <>
            <div className="page-header">
              <h1>All <span className="gradient-text">Jobs</span></h1>
              <p>{MOCK_JOBS.length} jobs in the system</p>
            </div>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Job ID</th><th>Consumer</th><th>Node</th><th>Status</th><th>Priority</th><th>Progress</th><th>Cost</th></tr>
                </thead>
                <tbody>
                  {MOCK_JOBS.map(j => {
                    const node = MOCK_GPU_NODES.find(n => n.id === j.gpu_node_id);
                    return (
                      <tr key={j.id}>
                        <td><span className="mono" style={{ fontSize: '0.75rem' }}>#{j.id.slice(-6)}</span></td>
                        <td>{j.consumer_id.slice(-8)}</td>
                        <td style={{ fontSize: '0.82rem' }}>{node?.gpu_model ?? '—'}</td>
                        <td><span className={`badge badge-${j.status === 'migrating' ? 'migrating' : j.status}`}>{j.status}</span></td>
                        <td><span className="chip" style={{ fontSize: '0.7rem' }}>{j.priority.replace('_', ' ')}</span></td>
                        <td>
                          {j.progress_pct !== undefined ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress-bar" style={{ flex: 1 }}>
                                <div className="progress-fill" style={{ width: `${j.progress_pct}%` }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#00d4ff', width: 32 }}>{j.progress_pct}%</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#00ff88', fontWeight: 700 }}>
                          ${(j.actual_cost ?? j.estimated_cost ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
