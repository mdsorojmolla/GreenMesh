'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GPU_CATALOG, CARBON_REGIONS } from '@/lib/mockData';
import { computeTrustScore, getPriceBand, checkSpecMismatch } from '@/lib/aiEngine';

const STEPS = ['Account', 'Hardware', 'Verification', 'Pricing', 'Done'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 48 }}>
      {STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: done ? 'linear-gradient(135deg, #00ff88, #00d4ff)' : active ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${done ? 'transparent' : active ? '#00d4ff' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 800,
                color: done ? '#080b14' : active ? '#00d4ff' : 'var(--color-text-muted)',
                boxShadow: active ? '0 0 16px rgba(0,212,255,0.3)' : 'none',
                transition: 'all 0.3s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: active ? '#00d4ff' : 'var(--color-text-muted)', textAlign: 'center', width: 70, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 60, height: 2, background: done ? 'linear-gradient(90deg, #00ff88, #00d4ff)' : 'rgba(255,255,255,0.07)', marginTop: 17, flexShrink: 0, transition: 'background 0.5s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function BenchmarkAnimation() {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState(0);
  const phases = [
    'Initializing GPU driver check...',
    'Running CUDA kernel benchmark...',
    'Testing VRAM bandwidth...',
    'Measuring tensor core performance...',
    'Validating memory specifications...',
    'Computing benchmark score...',
    'Verification complete! ✓',
  ];

  useEffect(() => {
    if (pct >= 100) return; // already done, no new interval needed
    const timer = setInterval(() => {
      setPct(p => {
        const next = p + 2;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
      setPhase(p => Math.min(p + 0.15, phases.length - 1));
    }, 80);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: 20 }}>🔬</div>
      <h3 style={{ marginBottom: 8 }}>Running Benchmark Verification</h3>
      <p style={{ marginBottom: 24 }}>This verifies your GPU specs and builds your initial trust score</p>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 8, color: 'var(--color-text-muted)' }}>
          <span>{phases[Math.floor(phase)]}</span>
          <span style={{ color: '#00d4ff', fontWeight: 700 }}>{pct}%</span>
        </div>
        <div className="progress-bar" style={{ height: 8 }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {pct >= 100 && (
        <div style={{ marginTop: 24 }}>
          <div className="grid-3" style={{ gap: 12, marginBottom: 16 }}>
            {[
              { label: 'VRAM Verified',  value: '24.0 GB', color: '#00ff88' },
              { label: 'Benchmark Score',value: '97.8/100',color: '#00d4ff' },
              { label: 'Trust Starting', value: '70.0',    color: '#a78bfa' },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProviderOnboardPage() {
  const [step, setStep] = useState(0);
  const [benchmarkDone, setBenchmarkDone] = useState(false);
  const [form, setForm] = useState({
    display_name: '',
    email: '',
    country: 'Norway',
    gpu_model: 'NVIDIA RTX 4090',
    vram_gb: 24,
    hourly_price: 190,
  });

  const gpu = GPU_CATALOG.find(g => g.model === form.gpu_model);
  const priceBand = getPriceBand(gpu?.tier ?? 'high', 5, 8);

  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => setBenchmarkDone(true), 9000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar__logo">
          <div className="navbar__logo-icon">⚡</div>
          <span className="gradient-text">GreenMesh</span>
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/marketplace" className="btn btn-secondary btn-sm">Browse Marketplace</Link>
        </div>
      </nav>

      <main style={{ paddingTop: 100, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 700, width: '100%', padding: '0 24px 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1>Become a <span className="gradient-text">Provider</span></h1>
            <p style={{ marginTop: 12 }}>Earn money from your idle GPU. Takes less than 5 minutes to set up.</p>
          </div>

          <StepIndicator current={step} />

          <div className="glass-card" style={{ padding: 40 }}>
            {/* Step 0: Account */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3>👤 Create Provider Account</h3>
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input className="input" placeholder="My GPU Rig" value={form.display_name}
                    onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="input" type="email" placeholder="you@example.com" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <select className="select" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                    {Object.keys(CARBON_REGIONS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Carbon preview */}
                {form.country && CARBON_REGIONS[form.country] && (
                  <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#00ff88', marginBottom: 6 }}>🌿 Carbon Profile for {form.country}</div>
                    <div style={{ display: 'flex', gap: 20, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                      <span>Grid intensity: <strong style={{ color: '#00ff88' }}>{CARBON_REGIONS[form.country].gco2_kwh} gCO₂/kWh</strong></span>
                      <span>Renewable: <strong style={{ color: '#4ade80' }}>{CARBON_REGIONS[form.country].renewable_pct}%</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Hardware */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3>🖥️ Register GPU Hardware</h3>
                <div className="form-group">
                  <label className="form-label">GPU Model</label>
                  <select className="select" value={form.gpu_model} onChange={e => {
                    const g = GPU_CATALOG.find(gpu => gpu.model === e.target.value);
                    setForm(f => ({ ...f, gpu_model: e.target.value, vram_gb: g?.vram_gb ?? 16 }));
                  }}>
                    {GPU_CATALOG.map(g => <option key={g.model} value={g.model}>{g.model} ({g.vram_gb}GB)</option>)}
                  </select>
                </div>

                {gpu && (
                  <div className="glass-card" style={{ padding: 16, border: '1px solid rgba(0,212,255,0.15)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#00d4ff', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Detected Specifications
                    </div>
                    <div className="grid-2" style={{ gap: 12 }}>
                      {[
                        { label: 'VRAM',       value: `${gpu.vram_gb}GB` },
                        { label: 'CUDA Cores', value: gpu.cuda_cores?.toLocaleString() },
                        { label: 'TFLOPS',     value: `${gpu.tflops} FP32` },
                        { label: 'GPU Tier',   value: gpu.tier.toUpperCase() },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>🔒 Security Note</div>
                  <p style={{ fontSize: '0.82rem' }}>
                    Consumer jobs run in an isolated Docker + gVisor sandbox. Your host filesystem and
                    network are never accessible to consumer code.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Benchmark */}
            {step === 2 && (
              <div>
                <h3 style={{ marginBottom: 4 }}>🔬 GPU Verification</h3>
                <p style={{ marginBottom: 24 }}>A standardized benchmark job runs to verify your claimed GPU specs and compute your initial trust score.</p>
                <BenchmarkAnimation />
              </div>
            )}

            {/* Step 3: Pricing */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3>💰 Set Your Price</h3>
                <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: '0.78rem', color: '#00ff88', fontWeight: 700, marginBottom: 8 }}>🧠 AI Pricing Recommendation</div>
                  <p style={{ fontSize: '0.85rem', marginBottom: 12 }}>Based on current supply/demand and your GPU tier ({gpu?.tier?.toUpperCase()}):</p>
                  <div className="grid-3" style={{ gap: 10 }}>
                    {[
                      { label: 'Floor',       value: `৳${priceBand.floor}`, color: '#4ade80' },
                      { label: 'Recommended', value: `৳${priceBand.recommended}`, color: '#00d4ff' },
                      { label: 'Ceiling',     value: `৳${priceBand.ceiling}`, color: '#f59e0b' },
                    ].map(b => (
                      <div key={b.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{b.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.2rem', color: b.color }}>{b.value}/hr</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Your Price (৳/hr)</label>
                  <input className="input" type="number" min={priceBand.floor} max={priceBand.ceiling} step={1}
                    value={form.hourly_price} onChange={e => setForm(f => ({ ...f, hourly_price: +e.target.value }))} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Must be between ৳{priceBand.floor} and ৳{priceBand.ceiling}
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                    <span>If running 8hrs/day</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#00ff88', fontWeight: 700 }}>৳{(form.hourly_price * 8 * 0.88).toFixed(0)}/day</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Monthly estimate</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#00ff88', fontWeight: 700 }}>৳{(form.hourly_price * 8 * 30 * 0.88).toFixed(0)}/month</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 8 }}>After 12% platform fee</div>
                </div>
              </div>
            )}

            {/* Step 4: Done */}
            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '4rem', marginBottom: 20 }}>🎉</div>
                <h2 className="gradient-text" style={{ marginBottom: 12 }}>You're Live!</h2>
                <p style={{ marginBottom: 32 }}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>{form.display_name || 'Your'}</strong> GPU is now registered
                  on GreenMesh and visible in the marketplace. You'll earn money every time a job runs on your hardware.
                </p>
                <div className="grid-3" style={{ gap: 12, marginBottom: 32 }}>
                  {[
                    { label: 'Trust Score',  value: '70.0', color: '#00d4ff' },
                    { label: 'GPU Model',    value: form.gpu_model.split(' ').slice(-1)[0], color: '#00ff88' },
                    { label: 'Your Price',   value: `৳${form.hourly_price}/hr`, color: '#a78bfa' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 16 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.2rem', color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <Link href="/dashboard/provider" className="btn btn-primary">View Provider Dashboard →</Link>
                  <Link href="/marketplace" className="btn btn-secondary">Browse Marketplace</Link>
                </div>
              </div>
            )}

            {/* Navigation */}
            {step < 4 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button className="btn btn-secondary" onClick={() => setStep(s => Math.max(0, s - 1))} style={{ visibility: step > 0 ? 'visible' : 'hidden' }}>
                  ← Back
                </button>
                <button
                  className="btn btn-primary"
                  disabled={step === 2 && !benchmarkDone}
                  onClick={() => setStep(s => s + 1)}
                  style={{ opacity: step === 2 && !benchmarkDone ? 0.5 : 1 }}>
                  {step === 2 ? (benchmarkDone ? 'Continue →' : 'Running benchmark...') : step === 3 ? 'Complete Setup →' : 'Continue →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
