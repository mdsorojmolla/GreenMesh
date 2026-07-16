'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_GPU_NODES, MOCK_PROVIDERS, CARBON_REGIONS } from '@/lib/mockData';
import { runScheduler, getCarbonScore, getTrustLabel } from '@/lib/aiEngine';
import type { GPUNode, PriorityMode } from '@/lib/types';

function TrustRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const { color } = getTrustLabel(score);
  const fill = (score / 100) * circ;
  return (
    <div className="trust-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="trust-ring__label">
        <span style={{ fontSize: size === 56 ? '0.85rem' : '0.7rem', fontWeight: 800, color }}>
          {score.toFixed(0)}
        </span>
        <span className="trust-ring__sub">trust</span>
      </div>
    </div>
  );
}

function CarbonBadge({ gco2 }: { gco2: number }) {
  const { label, color } = getCarbonScore(gco2);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700,
      background: `${color}15`, color, border: `1px solid ${color}30`,
    }}>
      🌿 {label}
    </span>
  );
}

function NodeCard({ node, onSelect }: { node: GPUNode; onSelect: (n: GPUNode) => void }) {
  const provider = MOCK_PROVIDERS.find(p => p.id === node.provider_id);
  const carbon = getCarbonScore(node.carbon_intensity_gco2_kwh);
  const trust = getTrustLabel(provider?.trust_score ?? 50);

  const statusClass = {
    idle: 'badge-online',
    busy: 'badge-busy',
    offline: 'badge-offline',
    degraded: 'badge-degraded',
    banned: 'badge-failed',
  }[node.status] || 'badge-offline';

  return (
    <div className="glass-card glass-card-hover" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer' }}
      onClick={() => onSelect(node)}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
            {node.gpu_model}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {provider?.location_city}, {provider?.location_country}
          </div>
        </div>
        <span className={`badge ${statusClass}`}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          {node.status.toUpperCase()}
        </span>
      </div>

      {/* Specs row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span className="chip">💾 {node.vram_gb}GB VRAM</span>
        <span className="chip">⚡ {node.tflops} TFLOPS</span>
        <span className="chip">🔧 CUDA {node.cuda_cores?.toLocaleString()}</span>
      </div>

      <CarbonBadge gco2={node.carbon_intensity_gco2_kwh} />

      {/* Benchmark bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4, color: 'var(--color-text-muted)' }}>
          <span>Benchmark Score</span><span style={{ color: 'var(--color-accent-cyan)', fontWeight: 700 }}>{node.benchmark_score}/100</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${node.benchmark_score}%` }} />
        </div>
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-accent-green)', fontSize: '1rem' }}>
            ৳{node.hourly_price.toFixed(0)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>/hr</span>
        </div>
        <TrustRing score={provider?.trust_score ?? 50} />
      </div>

      {node.status === 'idle' && (
        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}
          onClick={(e) => { e.stopPropagation(); onSelect(node); }}>
          🚀 Launch Job
        </button>
      )}
    </div>
  );
}

function SchedulerModal({ node, onClose }: { node: GPUNode; onClose: () => void }) {
  const [priority, setPriority] = useState<PriorityMode>('standard');
  const [vram, setVram] = useState(16);
  const [image, setImage] = useState('pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime');
  const [submitted, setSubmitted] = useState(false);

  const scores = useMemo(() =>
    runScheduler(MOCK_GPU_NODES, { requested_vram_gb: vram, priority }, MOCK_PROVIDERS, priority),
    [priority, vram]
  );
  const thisScore = scores.find(s => s.node_id === node.id);

  function handleSubmit() {
    setSubmitted(true);
    setTimeout(onClose, 2000);
  }

  if (submitted) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 4 + 'rem', marginBottom: 16 }}>✅</div>
        <h3>Job Queued!</h3>
        <p style={{ marginTop: 12 }}>Your job has been submitted and the AI Scheduler is finding the best node.</p>
        <div className="badge badge-running" style={{ margin: '20px auto', width: 'fit-content' }}>Processing...</div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div className="glass-card" style={{ maxWidth: 620, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 32 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3>🚀 Launch Job on {node.gpu_model}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Container Image</label>
            <input className="input" value={image} onChange={e => setImage(e.target.value)} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">VRAM Required (GB)</label>
              <select className="select" value={vram} onChange={e => setVram(+e.target.value)}>
                {[4,8,12,16,24,40,80].map(v => <option key={v} value={v}>{v}GB</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority Mode</label>
              <select className="select" value={priority} onChange={e => setPriority(e.target.value as PriorityMode)}>
                <option value="standard">⚖️ Balanced</option>
                <option value="low_cost">💰 Low Cost</option>
                <option value="carbon_optimized">🌿 Carbon Optimized</option>
                <option value="low_latency">⚡ Low Latency</option>
              </select>
            </div>
          </div>

          {/* AI Scheduler Score */}
          {thisScore && (
            <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-accent-green)' }}>🧠 AI Scheduler Score</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-accent-green)', fontFamily: 'var(--font-mono)' }}>
                  {thisScore.score.toFixed(1)}/100 · Rank #{thisScore.rank}
                </span>
              </div>
              {Object.entries({
                'Price Efficiency': thisScore.breakdown.price_score,
                'Provider Trust':   thisScore.breakdown.trust_score,
                'Carbon Score':     thisScore.breakdown.carbon_score,
                'Latency Score':    thisScore.breakdown.latency_score,
                'VRAM Headroom':    thisScore.breakdown.vram_score,
              }).map(([label, val]) => (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 3, color: 'var(--color-text-muted)' }}>
                    <span>{label}</span><span style={{ fontWeight: 600 }}>{val}/100</span>
                  </div>
                  <div className="progress-bar" style={{ height: 4 }}>
                    <div className="progress-fill" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>Estimated Cost</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-accent-green)' }}>
              ~৳{(node.hourly_price * 2).toFixed(0)}/hr
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} onClick={handleSubmit}>
            🚀 Submit Job → AI Scheduler
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [minVram, setMinVram] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState('price');
  const [priorityMode, setPriorityMode] = useState<PriorityMode>('standard');
  const [selectedNode, setSelectedNode] = useState<GPUNode | null>(null);

  // AI Scheduler pre-score all nodes
  const scores = useMemo(() =>
    runScheduler(MOCK_GPU_NODES, { requested_vram_gb: minVram || 0 }, MOCK_PROVIDERS, priorityMode),
    [minVram, priorityMode]
  );
  const scoreMap = new Map(scores.map(s => [s.node_id, s]));

  const filtered = useMemo(() => {
    return MOCK_GPU_NODES
      .filter(n => {
        if (search && !n.gpu_model.toLowerCase().includes(search.toLowerCase()) &&
          !MOCK_PROVIDERS.find(p => p.id === n.provider_id)?.location_country.toLowerCase().includes(search.toLowerCase())) return false;
        if (n.vram_gb < minVram) return false;
        if (n.hourly_price > maxPrice) return false;
        if (filterStatus !== 'all' && n.status !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price') return a.hourly_price - b.hourly_price;
        if (sortBy === 'vram') return b.vram_gb - a.vram_gb;
        if (sortBy === 'carbon') return a.carbon_intensity_gco2_kwh - b.carbon_intensity_gco2_kwh;
        if (sortBy === 'trust') {
          const ta = MOCK_PROVIDERS.find(p => p.id === a.provider_id)?.trust_score ?? 0;
          const tb = MOCK_PROVIDERS.find(p => p.id === b.provider_id)?.trust_score ?? 0;
          return tb - ta;
        }
        if (sortBy === 'ai_score') {
          return (scoreMap.get(b.id)?.score ?? 0) - (scoreMap.get(a.id)?.score ?? 0);
        }
        return 0;
      });
  }, [search, minVram, maxPrice, filterStatus, sortBy, scoreMap]);

  const onlineCount = MOCK_GPU_NODES.filter(n => n.status !== 'offline' && n.status !== 'banned').length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('revealed')),
      { threshold: 0.05 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar__logo">
          <div className="navbar__logo-icon">⚡</div>
          <span className="gradient-text">GreenMesh</span>
        </Link>
        <ul className="navbar__links">
          <li><Link href="/marketplace" style={{ color: 'var(--color-accent-green)' }}>Marketplace</Link></li>
          <li><Link href="/jobs">My Jobs</Link></li>
          <li><Link href="/dashboard/consumer">Dashboard</Link></li>
        </ul>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard/admin" className="btn btn-secondary btn-sm">Admin</Link>
          <Link href="/dashboard/consumer" className="btn btn-primary btn-sm">My Account</Link>
        </div>
      </nav>

      <main style={{ paddingTop: 80, minHeight: '100vh' }}>
        {/* Page header */}
        <div style={{ background: 'rgba(0,255,136,0.03)', borderBottom: '1px solid rgba(0,255,136,0.08)', padding: '40px 0 32px' }}>
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <h1 style={{ fontSize: '2.2rem', marginBottom: 8 }}>GPU <span className="gradient-text">Marketplace</span></h1>
                <p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-accent-green)', fontWeight: 600 }}>
                    <span className="pulse-dot" />
                    {onlineCount} nodes available
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: 12 }}>· AI Scheduler ready</span>
                </p>
              </div>
              {/* Priority mode selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>🧠 Priority:</span>
                {(['standard','low_cost','carbon_optimized','low_latency'] as PriorityMode[]).map(m => (
                  <button key={m} onClick={() => { setPriorityMode(m); setSortBy('ai_score'); }}
                    className={`btn btn-sm ${priorityMode === m ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.72rem' }}>
                    {m === 'standard' ? '⚖️ Balanced' : m === 'low_cost' ? '💰 Cost' : m === 'carbon_optimized' ? '🌿 Carbon' : '⚡ Speed'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="page-container" style={{ paddingTop: 32, paddingBottom: 80 }}>
          {/* Filters */}
          <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="input" style={{ maxWidth: 220 }} placeholder="🔍 Search GPU model, country..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Min VRAM</span>
              <select className="select" style={{ width: 100 }} value={minVram} onChange={e => setMinVram(+e.target.value)}>
                {[0,8,12,16,24,40,80].map(v => <option key={v} value={v}>{v ? v+'GB' : 'Any'}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Max $/hr</span>
              <select className="select" style={{ width: 100 }} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)}>
                {[0.5,1,2,3,5,7,10].map(v => <option key={v} value={v}>${v}</option>)}
              </select>
            </div>
            <select className="select" style={{ width: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="idle">✅ Idle</option>
              <option value="busy">🔄 Busy</option>
              <option value="degraded">⚠️ Degraded</option>
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Sort:</span>
              <select className="select" style={{ width: 150 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="ai_score">🧠 AI Score</option>
                <option value="price">💰 Price</option>
                <option value="vram">💾 VRAM</option>
                <option value="carbon">🌿 Carbon</option>
                <option value="trust">🛡️ Trust</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <p style={{ marginBottom: 20, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filtered.length}</strong> nodes
            {priorityMode !== 'standard' && <span> · Ranked by <span style={{ color: 'var(--color-accent-cyan)' }}>AI Scheduler ({priorityMode} mode)</span></span>}
          </p>

          {/* Node grid */}
          {filtered.length > 0 ? (
            <div className="grid-3 reveal">
              {filtered.map(node => (
                <div key={node.id} style={{ position: 'relative' }}>
                  {sortBy === 'ai_score' && scoreMap.has(node.id) && (
                    <div style={{
                      position: 'absolute', top: -10, right: 12, zIndex: 2,
                      background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                      color: '#080b14', padding: '2px 10px', borderRadius: 999,
                      fontSize: '0.7rem', fontWeight: 800,
                    }}>
                      #{scoreMap.get(node.id)!.rank} · AI {scoreMap.get(node.id)!.score.toFixed(0)}pts
                    </div>
                  )}
                  <NodeCard node={node} onSelect={setSelectedNode} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
              <h3>No nodes match your filters</h3>
              <p>Try adjusting VRAM, price, or status filters</p>
            </div>
          )}
        </div>
      </main>

      {selectedNode && <SchedulerModal node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </>
  );
}
