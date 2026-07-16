'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MOCK_JOBS, MOCK_GPU_NODES, MOCK_PROVIDERS, MOCK_JOB_EVENTS, MOCK_PLATFORM_STATS } from '@/lib/mockData';
import { getCarbonScore, estimateJobCarbonKg } from '@/lib/aiEngine';
import type { Job, JobStatus } from '@/lib/types';

const STATUS_STAGES: JobStatus[] = ['queued', 'scheduled', 'running', 'completed'];

function JobPipeline({ status }: { status: JobStatus }) {
  const stages = ['queued', 'scheduled', 'running', status === 'migrating' ? 'migrating' : 'completed'];
  const failed = status === 'failed' || status === 'cancelled';
  const currentIdx = failed ? -1 : stages.indexOf(status === 'migrating' ? 'migrating' : status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '12px 0' }}>
      {stages.map((stage, i) => {
        const done = !failed && i < currentIdx;
        const active = !failed && i === currentIdx;
        const color = done ? '#00ff88' : active ? '#00d4ff' : 'rgba(255,255,255,0.1)';
        const textColor = done ? '#00ff88' : active ? '#00d4ff' : 'var(--color-text-muted)';
        return (
          <React.Fragment key={stage}>
            <div style={{ textAlign: 'center', minWidth: 64 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', margin: '0 auto 4px',
                background: done ? '#00ff88' : active ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800, color: done ? '#080b14' : textColor,
                boxShadow: active ? '0 0 12px rgba(0,212,255,0.4)' : 'none',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: textColor, fontWeight: 600 }}>
                {stage}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#00ff88' : 'rgba(255,255,255,0.07)', transition: 'background 0.5s', marginBottom: 20 }} />
            )}
          </React.Fragment>
        );
      })}
      {failed && <span className="badge badge-failed" style={{ marginLeft: 8 }}>{status}</span>}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const node = MOCK_GPU_NODES.find(n => n.id === job.gpu_node_id);
  const provider = MOCK_PROVIDERS.find(p => p.id === node?.provider_id);
  const events = MOCK_JOB_EVENTS.filter(e => e.job_id === job.id);
  const [expanded, setExpanded] = useState(false);

  const carbonKg = node ? estimateJobCarbonKg(
    (job.runtime_minutes ?? 0) / 60,
    250,
    node.carbon_intensity_gco2_kwh
  ) : 0;

  const statusClass = `badge-${job.status === 'migrating' ? 'migrating' : job.status}`;

  return (
    <div className="glass-card" style={{ marginBottom: 16 }}>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>#{job.id.slice(-6)}</span>
              <span className={`badge ${statusClass}`}>{job.status.toUpperCase()}</span>
              {job.status === 'migrating' && (
                <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>🔄 Auto-migrating...</span>
              )}
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
              {job.container_image}
            </div>
            {node && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {node.gpu_model} · {provider?.location_city}, {provider?.location_country}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-accent-green)', fontSize: '1.1rem' }}>
              ৳{(job.actual_cost ?? job.estimated_cost).toFixed(0)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              {job.actual_cost ? 'actual' : 'estimated'}
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <JobPipeline status={job.status} />

        {/* Progress bar for running */}
        {(job.status === 'running' || job.status === 'migrating') && job.progress_pct !== undefined && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4, color: 'var(--color-text-muted)' }}>
              <span>Progress</span>
              <span style={{ color: 'var(--color-accent-cyan)', fontWeight: 700 }}>{job.progress_pct}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${job.progress_pct}%` }} />
            </div>
          </div>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 20, fontSize: '0.78rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
          <span>💾 {job.requested_vram_gb}GB</span>
          <span>🎯 {job.priority.replace('_', ' ')}</span>
          {job.runtime_minutes ? <span>⏱ {job.runtime_minutes}min</span> : null}
          {carbonKg > 0 && <span style={{ color: '#4ade80' }}>🌿 {carbonKg.toFixed(2)}kg CO₂</span>}
          {job.checkpoint_uri && <span style={{ color: '#a78bfa' }}>💾 Checkpointed</span>}
        </div>
      </div>

      {/* Expandable events log */}
      {events.length > 0 && (
        <>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '8px 24px' }}>
            <button onClick={() => setExpanded(x => !x)}
              style={{ background: 'none', border: 'none', color: 'var(--color-accent-cyan)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
              {expanded ? '▲' : '▼'} Event Log ({events.length})
            </button>
          </div>
          {expanded && (
            <div style={{ padding: '0 24px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.map(ev => (
                <div key={ev.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                  <span className={`badge badge-${ev.event_type === 'migrated' ? 'migrating' : ev.event_type === 'completed' ? 'completed' : 'running'}`}>
                    {ev.event_type}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)', flex: 1 }}>
                    {Object.entries(ev.metadata).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: string }) {
  return (
    <div className="glass-card stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="stat-card__label">{label}</span>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      <span className="stat-card__value mono" style={{ color }}>{value}</span>
      {sub && <span className="stat-card__sub">{sub}</span>}
    </div>
  );
}

export default function ConsumerDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'spending' | 'carbon'>('overview');
  const [simProgress, setSimProgress] = useState<Record<string, number>>({});

  // Simulate job progress
  useEffect(() => {
    const init: Record<string, number> = {};
    MOCK_JOBS.filter(j => j.status === 'running').forEach(j => { init[j.id] = j.progress_pct ?? 0; });
    setSimProgress(init);

    const interval = setInterval(() => {
      setSimProgress(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => { next[id] = Math.min(100, next[id] + Math.random() * 0.5); });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const myJobs = MOCK_JOBS;
  const runningJobs  = myJobs.filter(j => j.status === 'running' || j.status === 'migrating');
  const completedJobs = myJobs.filter(j => j.status === 'completed');
  const totalSpend = myJobs.reduce((s, j) => s + (j.actual_cost ?? j.estimated_cost ?? 0), 0);
  const totalCarbon = myJobs.reduce((s, j) => {
    const node = MOCK_GPU_NODES.find(n => n.id === j.gpu_node_id);
    return s + (node ? estimateJobCarbonKg((j.runtime_minutes ?? 0) / 60, 250, node.carbon_intensity_gco2_kwh) : 0);
  }, 0);

  const displayJobs = myJobs.map(j => ({
    ...j,
    progress_pct: j.status === 'running' ? (simProgress[j.id] ?? j.progress_pct) : j.progress_pct,
  }));

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '12px 16px 24px' }}>
          <Link href="/" className="navbar__logo" style={{ textDecoration: 'none' }}>
            <div className="navbar__logo-icon">⚡</div>
            <span className="gradient-text" style={{ fontSize: '1rem' }}>GreenMesh</span>
          </Link>
        </div>
        <span className="sidebar__section-label">Consumer</span>
        {[
          { label: '📊 Overview',    tab: 'overview'  },
          { label: '🚀 My Jobs',    tab: 'jobs'       },
          { label: '💰 Spending',   tab: 'spending'   },
          { label: '🌿 Carbon',     tab: 'carbon'     },
        ].map(item => (
          <button key={item.tab} onClick={() => setActiveTab(item.tab as typeof activeTab)}
            className={`sidebar__item ${activeTab === item.tab ? 'active' : ''}`}>
            {item.label}
          </button>
        ))}
        <div className="divider" />
        <span className="sidebar__section-label">Quick Links</span>
        <Link href="/marketplace" className="sidebar__item">🖥️ Marketplace</Link>
        <Link href="/dashboard/provider" className="sidebar__item">🏗️ Provider View</Link>
        <Link href="/dashboard/admin" className="sidebar__item">🛡️ Admin Panel</Link>
      </aside>

      {/* Main */}
      <main className="main-content">
        <nav className="navbar" style={{ left: 0, position: 'sticky', top: 0, zIndex: 50 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Consumer Dashboard</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--color-accent-green)' }}>
              <span className="pulse-dot" />
              {runningJobs.length} job{runningJobs.length !== 1 ? 's' : ''} running
            </span>
            <Link href="/marketplace" className="btn btn-primary btn-sm">+ New Job</Link>
          </div>
        </nav>

        {activeTab === 'overview' && (
          <>
            <div className="page-header">
              <h1>Welcome back, <span className="gradient-text">Alice</span></h1>
              <p>Stanford AI Lab · Consumer Account</p>
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 32 }}>
              <StatCard label="Running Jobs"    value={String(runningJobs.length)}       sub="1 migrating" color="var(--color-accent-cyan)"  icon="🚀" />
              <StatCard label="Completed Today" value={String(completedJobs.length)}     sub="all succeeded" color="var(--color-accent-green)" icon="✅" />
              <StatCard label="Total Spent"     value={`৳${totalSpend.toFixed(0)}`}      sub="this session" color="var(--color-accent-green)"  icon="💰" />
              <StatCard label="CO₂ Footprint"   value={`${totalCarbon.toFixed(1)}kg`}   sub="total compute" color="#4ade80"                    icon="🌿" />
            </div>

            {/* Active jobs */}
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Active Jobs</h3>
            {runningJobs.length === 0 ? (
              <div className="empty-state">
                <p>No running jobs. <Link href="/marketplace" style={{ color: 'var(--color-accent-cyan)' }}>Browse the marketplace →</Link></p>
              </div>
            ) : (
              displayJobs.filter(j => j.status === 'running' || j.status === 'migrating' || j.status === 'queued' || j.status === 'scheduled').map(job => (
                <JobCard key={job.id} job={job} />
              ))
            )}

            {/* Platform stats */}
            <h3 style={{ marginTop: 32, marginBottom: 16, fontWeight: 700 }}>Platform Status</h3>
            <div className="glass-card" style={{ padding: 20 }}>
              <div className="grid-4">
                {[
                  { label: 'Nodes Online',    value: MOCK_PLATFORM_STATS.total_nodes_online },
                  { label: 'Jobs Running',    value: MOCK_PLATFORM_STATS.total_jobs_running },
                  { label: 'Completed Today', value: MOCK_PLATFORM_STATS.total_jobs_completed_today },
                  { label: 'Avg ৳/hr',        value: `৳${MOCK_PLATFORM_STATS.avg_price_per_hour.toFixed(0)}` },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'jobs' && (
          <>
            <div className="page-header">
              <h1>My <span className="gradient-text">Jobs</span></h1>
              <p>{myJobs.length} total jobs across all sessions</p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {(['all', 'running', 'queued', 'completed', 'failed', 'migrating'] as const).map(s => (
                <span key={s} className={`badge badge-${s === 'all' ? 'scheduled' : s}`} style={{ cursor: 'pointer' }}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? myJobs.length : myJobs.filter(j => j.status === s).length})
                </span>
              ))}
            </div>
            {displayJobs.map(job => <JobCard key={job.id} job={job} />)}
          </>
        )}

        {activeTab === 'spending' && (
          <>
            <div className="page-header">
              <h1><span className="gradient-text">Spending</span> Analytics</h1>
              <p>Cost breakdown across all compute sessions</p>
            </div>
            <div className="grid-3" style={{ marginBottom: 32 }}>
              <StatCard label="Total Spent"   value={`৳${totalSpend.toFixed(0)}`} sub="all time" color="var(--color-accent-green)" icon="💸" />
              <StatCard label="Avg Cost/Job"  value={`৳${(totalSpend / Math.max(myJobs.length, 1)).toFixed(0)}`} sub="per job" color="var(--color-accent-cyan)" icon="📊" />
              <StatCard label="Avg Cost/Hour" value={`৳${MOCK_PLATFORM_STATS.avg_price_per_hour.toFixed(0)}`} sub="vs ৳385 cloud" color="#a78bfa" icon="⏱" />
            </div>
            <div className="glass-card" style={{ padding: 24 }}>
              <h4 style={{ marginBottom: 20 }}>Cost per Job</h4>
              <div className="scroll-x">
                <table className="data-table">
                  <thead>
                    <tr><th>Job ID</th><th>Container</th><th>GPU</th><th>Runtime</th><th>Priority</th><th>Cost</th></tr>
                  </thead>
                  <tbody>
                    {myJobs.map(j => {
                      const node = MOCK_GPU_NODES.find(n => n.id === j.gpu_node_id);
                      return (
                        <tr key={j.id}>
                          <td><span className="mono" style={{ fontSize: '0.75rem' }}>#{j.id.slice(-6)}</span></td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{j.container_image.split(':')[0].split('/').pop()}</td>
                          <td>{node?.gpu_model ?? '—'}</td>
                          <td>{j.runtime_minutes ? `${j.runtime_minutes}min` : '—'}</td>
                          <td><span className={`badge badge-${j.status}`}>{j.priority.replace('_', ' ')}</span></td>
                          <td style={{ color: 'var(--color-accent-green)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            ৳{(j.actual_cost ?? j.estimated_cost ?? 0).toFixed(0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'carbon' && (
          <>
            <div className="page-header">
              <h1>🌿 Carbon <span className="gradient-text">Footprint</span></h1>
              <p>Your compute's environmental impact vs. traditional cloud</p>
            </div>
            <div className="grid-3" style={{ marginBottom: 32 }}>
              <StatCard label="Your CO₂" value={`${totalCarbon.toFixed(2)}kg`} sub="all compute" color="#4ade80" icon="🌿" />
              <StatCard label="Cloud Equivalent" value={`${(totalCarbon * 4.2).toFixed(2)}kg`} sub="US-East estimate" color="#ef4444" icon="🏭" />
              <StatCard label="CO₂ Saved" value={`${(totalCarbon * 3.2).toFixed(2)}kg`} sub="by using GreenMesh" color="#00ff88" icon="♻️" />
            </div>
            <div className="glass-card" style={{ padding: 24 }}>
              <h4 style={{ marginBottom: 16 }}>Carbon by Job</h4>
              {myJobs.map(j => {
                const node = MOCK_GPU_NODES.find(n => n.id === j.gpu_node_id);
                const co2 = node ? estimateJobCarbonKg((j.runtime_minutes ?? 0) / 60, 250, node.carbon_intensity_gco2_kwh) : 0;
                const { label, color } = node ? getCarbonScore(node.carbon_intensity_gco2_kwh) : { label: 'N/A', color: '#555' };
                return (
                  <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', width: 70 }}>#{j.id.slice(-6)}</span>
                    <span style={{ width: 100, fontSize: '0.78rem' }}>{node?.gpu_model?.split(' ').slice(-2).join(' ') ?? '—'}</span>
                    <span style={{ fontSize: '0.72rem', color, fontWeight: 600, background: `${color}15`, padding: '2px 8px', borderRadius: 999 }}>{label}</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                      <div style={{ width: `${Math.min(co2 / 0.5 * 100, 100)}%`, height: '100%', background: color, borderRadius: 3 }} />
                    </div>
                    <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', width: 60, textAlign: 'right' }}>
                      {co2.toFixed(3)}kg
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
