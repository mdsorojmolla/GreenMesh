'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// ---- Animated Counter ----
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) { setCount(target); clearInterval(timer); }
        else setCount(Math.floor(current));
      }, duration / steps);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ---- Floating GPU Cards ----
const GPU_CARDS = [
  { model: 'NVIDIA H100', vram: '80GB', price: '৳682/hr', status: 'idle', carbon: 26, flag: '🇳🇴', trust: 96.8 },
  { model: 'NVIDIA RTX 4090', vram: '24GB', price: '৳190/hr', status: 'idle', carbon: 612, flag: '🇧🇩', trust: 78.5 },
  { model: 'NVIDIA A900', vram: '40GB', price: '৳374/hr', status: 'busy', carbon: 56, flag: '🇫🇷', trust: 85.4 },
];

function GPUFloatCard({ node, delay }: { node: typeof GPU_CARDS[0]; delay: number }) {
  const carbonColor = node.carbon < 100 ? '#00ff88' : node.carbon < 300 ? '#f59e0b' : '#ef4444';
  const statusColor = node.status === 'idle' ? '#00ff88' : '#f59e0b';
  return (
    <div className={styles.floatCard} style={{ animationDelay: `${delay}s` }}>
      <div className={styles.floatCard__header}>
        <span className={styles.floatCard__flag}>{node.flag}</span>
        <span className="badge" style={{
          background: `${statusColor}18`, color: statusColor,
          border: `1px solid ${statusColor}40`, fontSize: '0.7rem', padding: '2px 8px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
          {node.status.toUpperCase()}
        </span>
      </div>
      <div className={styles.floatCard__model}>{node.model}</div>
      <div className={styles.floatCard__vram}>{node.vram} VRAM</div>
      <div className={styles.floatCard__row}>
        <span className={styles.floatCard__price}>{node.price}</span>
        <span style={{ fontSize: '0.7rem', color: carbonColor, fontWeight: 600 }}>
          🌿 {node.carbon} gCO₂/kWh
        </span>
      </div>
      <div className={styles.floatCard__trust}>
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
          <div style={{ width: `${node.trust}%`, height: '100%', background: 'linear-gradient(90deg, #00ff88, #00d4ff)', borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: '0.72rem', color: '#8b9ab8', whiteSpace: 'nowrap' }}>Trust {node.trust}</span>
      </div>
    </div>
  );
}

// ---- Feature Card ----
function FeatureCard({ icon, title, desc, accent }: { icon: string; title: string; desc: string; accent: string }) {
  return (
    <div className={`glass-card glass-card-hover ${styles.featureCard}`}>
      <div className={styles.featureCard__icon} style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      <h3 className={styles.featureCard__title}>{title}</h3>
      <p className={styles.featureCard__desc}>{desc}</p>
    </div>
  );
}

// ---- Step ----
function Step({ number, title, desc, isLast }: { number: number; title: string; desc: string; isLast?: boolean }) {
  return (
    <div className={styles.step}>
      <div className={styles.step__line}>
        <div className={styles.step__number}>{number}</div>
        {!isLast && <div className={styles.step__connector} />}
      </div>
      <div className={styles.step__content}>
        <h4 className={styles.step__title}>{title}</h4>
        <p className={styles.step__desc}>{desc}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  // Scroll reveal
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal');
    elements.forEach(el => el.classList.add('not-revealed'));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.remove('not-revealed');
          e.target.classList.add('revealed');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
    );
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar__logo">
          <div className="navbar__logo-icon">⚡</div>
          <span className="gradient-text">GreenMesh</span>
        </div>
        <ul className="navbar__links">
          <li><Link href="/marketplace">Marketplace</Link></li>
          <li><Link href="/guidelines">Guidelines</Link></li>
          <li><Link href="#features">Features</Link></li>
          <li><Link href="#how-it-works">How It Works</Link></li>
          <li><Link href="/vgpu">vGPU Terminal</Link></li>
        </ul>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" className="btn btn-secondary btn-sm">Log In</Link>
          <Link href="/onboard/provider" className="btn btn-primary btn-sm">Get Started →</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={`page-container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className="pulse-dot" />
              <span>Starts at ৳22/hr · AI Compute Built for Bangladeshi Researchers & Students</span>
            </div>
            <h1>
              The First{' '}
              <span className="gradient-text">AI GPU</span>{' '}
              Marketplace in Bangladesh
            </h1>
            <p className={styles.heroSubtitle}>
              Empowering students and researchers from BUET, DU, NSU, and BRAC to rent high-performance GPUs
              at up to 70% lower cost than traditional cloud providers — backed by AI scheduling, auto-migration, and green energy routing.
            </p>
            <div className={styles.heroActions}>
              <Link href="/marketplace" className="btn btn-primary btn-lg">
                🚀 Browse GPUs
              </Link>
              <Link href="/onboard/provider" className="btn btn-secondary btn-lg">
                💰 Become a Provider
              </Link>
            </div>
            <div className={styles.heroStats}>
              {[
                { label: 'GPUs Online', value: <AnimatedCounter target={847} />, color: '#00ff88' },
                { label: 'Min Rate / Hour', value: <><span>৳</span><AnimatedCounter target={22} /></>, color: '#00d4ff' },
                { label: 'CO₂ Saved Today', value: <><AnimatedCounter target={184} />kg</>, color: '#4ade80' },
                { label: 'Uptime SLA', value: '99.9%', color: '#a78bfa' },
              ].map((s, i) => (
                <div key={i} className={styles.heroStat}>
                  <span className={styles.heroStatValue} style={{ color: s.color }}>{s.value}</span>
                  <span className={styles.heroStatLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.heroVisual}>
            {GPU_CARDS.map((card, i) => (
              <GPUFloatCard key={i} node={card} delay={i * 0.6} />
            ))}
            <div className={styles.heroOrb1} />
            <div className={styles.heroOrb2} />
          </div>
        </div>
      </section>

      {/* ── Live Stats Ticker ── */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          {[...Array(3)].flatMap(() => [
            '⚡ job-a41f: BUET CS Lab → RTX 4090 (Oslo) scheduled · ৳682/hr',
            '🌿 Carbon saved: 184.2 kg CO₂ saved today',
            '💰 DGrid Solutions: Earned ৳21,274 today',
            '🔄 job-007 auto-migrated: node degraded → new node assigned',
            '🛡️ Trust score updated: prov-002 → 84.1 (DGrid Solutions BD)',
            '📊 AI Scheduler: 847 jobs matched in < 200ms',
          ]).map((msg, i) => (
            <span key={i} className={styles.tickerItem}>{msg}</span>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className={styles.section}>
        <div className="page-container">
          <div className={`${styles.sectionHeader} reveal`}>
            <span className="tag tag-green">AI-Powered</span>
            <h2>Not just a marketplace.<br />An intelligent compute network.</h2>
            <p>Six AI subsystems work together to give consumers the best GPU experience,
              maximize provider earnings, and minimize carbon footprint.</p>
          </div>
          <div className={`grid-3 reveal`} style={{ marginTop: 48 }}>
            <FeatureCard icon="🧠" accent="#00ff88"
              title="AI Smart Scheduler"
              desc="Weighted scoring across price, trust, carbon intensity, latency, and VRAM. Priority modes: Cost, Carbon, Latency, Balanced." />
            <FeatureCard icon="💚" accent="#4ade80"
              title="Carbon-Aware Routing"
              desc="Real-time carbon intensity data from 15 regions. Carbon-optimized mode routes jobs to the greenest available GPU." />
            <FeatureCard icon="🔄" accent="#00d4ff"
              title="Auto Job Migration"
              desc="Periodic checkpoints + distributed migration controller. Provider goes offline? Your job resumes on a new node automatically." />
            <FeatureCard icon="🏥" accent="#f59e0b"
              title="GPU Health Engine"
              desc="Real-time telemetry monitoring. Threshold-based alerts + ML anomaly detection flags degrading hardware before failure." />
            <FeatureCard icon="🛡️" accent="#7c3aed"
              title="Fraud Detection"
              desc="Benchmark-based GPU verification at onboarding. Spec-mismatch detection, disconnect pattern analysis, geo-velocity checks." />
            <FeatureCard icon="📈" accent="#a78bfa"
              title="Dynamic Pricing AI"
              desc="Supply/demand pricing bands per GPU tier. Providers get fair rates; consumers get transparent, competitive pricing." />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className={styles.section} style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="page-container">
          <div className={`${styles.sectionHeader} reveal`}>
            <span className="tag tag-cyan">Simple Process</span>
            <h2>From idle GPU to running job<br />in under 60 seconds</h2>
          </div>
          <div className={styles.stepsGrid}>
            <div className="reveal">
              <h3 style={{ marginBottom: 32, color: 'var(--color-accent-cyan)' }}>For Consumers</h3>
              <Step number={1} title="Submit Job" desc="Specify your container image, VRAM requirements, budget, and priority mode (cost / carbon / latency)." />
              <Step number={2} title="AI Schedules" desc="Our weighted-scoring scheduler selects the optimal GPU node from the live pool in milliseconds." />
              <Step number={3} title="Run & Checkpoint" desc="Your job runs in a secure sandbox. Checkpoints saved periodically so no work is ever lost." />
              <Step number={4} title="Pay & Download" desc="Pay only for compute used. Results stored in your secure object storage bucket." isLast />
            </div>
            <div className="reveal" style={{ transitionDelay: '0.2s' }}>
              <h3 style={{ marginBottom: 32, color: 'var(--color-accent-green)' }}>For Providers</h3>
              <Step number={1} title="Install Agent" desc="One-command install. The lightweight agent runs on your machine and never touches your files." />
              <Step number={2} title="Verify GPU" desc="Automated benchmark job verifies your GPU specs — builds trust score from day one." />
              <Step number={3} title="Earn Passively" desc="Set your price and go about your day. Jobs run in isolated containers with resource limits." />
              <Step number={4} title="Get Paid" desc="Weekly payouts via bKash, Nagad, or direct bank transfer. Trust score improves with every successful job." isLast />
            </div>
          </div>
        </div>
      </section>

      {/* ── Carbon Impact ── */}
      <section className={styles.section}>
        <div className="page-container">
          <div className={`glass-card ${styles.carbonSection} reveal`}>
            <div className={styles.carbonLeft}>
              <span className="tag tag-green">🌍 Carbon Impact</span>
              <h2>Compute that cares<br />about the planet</h2>
              <p style={{ marginTop: 16 }}>
                By routing jobs to regions with renewable energy, GreenMesh reduces the carbon
                footprint of AI training by up to <strong style={{ color: '#00ff88' }}>73%</strong> compared
                to standard cloud regions.
              </p>
              <div className={styles.carbonStats}>
                {[
                  { label: 'CO₂ Saved This Month', value: <><AnimatedCounter target={5240} />kg</> },
                  { label: 'Equivalent Trees Planted', value: <AnimatedCounter target={262} /> },
                  { label: 'Jobs Carbon-Optimized', value: <><AnimatedCounter target={68} />%</> },
                ].map((s, i) => (
                  <div key={i} className={styles.carbonStat}>
                    <span className={styles.carbonStatValue}>{s.value}</span>
                    <span className={styles.carbonStatLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.carbonRight}>
              {[
                { country: '🇳🇴 Norway', intensity: 26, bar: 5, color: '#00ff88' },
                { country: '🇫🇷 France', intensity: 56, bar: 9, color: '#22c55e' },
                { country: '🇬🇧 UK', intensity: 225, bar: 35, color: '#f59e0b' },
                { country: '🇩🇪 Germany', intensity: 350, bar: 54, color: '#ef4444' },
                { country: '🇺🇸 US East', intensity: 386, bar: 60, color: '#ef4444' },
                { country: '🇧🇩 BD Grid', intensity: 612, bar: 85, color: '#dc2626' },
              ].map((r, i) => (
                <div key={i} className={styles.carbonRow}>
                  <span className={styles.carbonRowCountry}>{r.country}</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                    <div style={{ width: `${r.bar}%`, height: '100%', background: r.color, borderRadius: 3, transition: 'width 1.5s ease' }} />
                  </div>
                  <span className={styles.carbonRowValue} style={{ color: r.color }}>{r.intensity} gCO₂</span>
                </div>
              ))}
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 16 }}>
                Grid carbon intensity per region (gCO₂/kWh)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className={styles.section}>
        <div className="page-container">
          <div className={`${styles.sectionHeader} reveal`}>
            <span className="tag tag-purple">Transparent Pricing</span>
            <h2>Pay for compute, not overhead</h2>
            <p>No reserved instances, no minimum spend. Pure pay-as-you-go with AI-optimized matching.</p>
          </div>
          <div className="grid-4 reveal" style={{ marginTop: 48 }}>
            {[
              { tier: 'Entry', icon: '🎮', gpu: 'RTX 3060/3070', price: '৳9–৳33', vram: '8–12GB', best: 'Small Experiments' },
              { tier: 'Mid', icon: '💻', gpu: 'RTX 3080/4070', price: '৳28–৳83', vram: '10–16GB', best: 'Model Fine-tuning' },
              { tier: 'High', icon: '🖥️', gpu: 'RTX 4090/3090', price: '৳88–৳220', vram: '24GB', best: 'LLM Training', highlight: true },
              { tier: 'Ultra', icon: '⚡', gpu: 'A100 / H100', price: '৳165–৳715', vram: '40–80GB', best: 'Large Scale Models' },
            ].map((p, i) => (
              <div key={i} className={`glass-card glass-card-hover ${styles.pricingCard} ${p.highlight ? styles.pricingCardHL : ''}`}>
                <div className={styles.pricingIcon}>{p.icon}</div>
                <div className={styles.pricingTier}>{p.tier}</div>
                <div className={styles.pricingGPU}>{p.gpu}</div>
                <div className={styles.pricingPrice}>{p.price}<span>/hr</span></div>
                <div className={styles.pricingVram}>{p.vram} VRAM</div>
                <div className={styles.pricingBest}>Best for: {p.best}</div>
                <Link href="/marketplace" className={`btn ${p.highlight ? 'btn-primary' : 'btn-secondary'} btn-sm`} style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                  Browse {p.tier}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className="page-container">
          <div className={`${styles.ctaCard} glass-card reveal`}>
            <div className={styles.ctaOrb} />
            <span className="tag tag-green" style={{ marginBottom: 24 }}>🚀 Join the Network</span>
            <h2>Ready to compute smarter?</h2>
            <p style={{ marginTop: 16, marginBottom: 40, maxWidth: 560 }}>
              Join hundreds of students, researchers, and engineers across Bangladesh who use GreenMesh
              to run AI workloads faster, cheaper, and greener.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/marketplace" className="btn btn-primary btn-lg">Browse GPUs →</Link>
              <Link href="/onboard/provider" className="btn btn-secondary btn-lg">Earn as Provider</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className="page-container">
          <div className={styles.footerTop}>
            <div>
              <div className="navbar__logo" style={{ marginBottom: 12 }}>
                <div className="navbar__logo-icon">⚡</div>
                <span className="gradient-text" style={{ fontSize: '1.1rem', fontWeight: 800 }}>GreenMesh</span>
              </div>
              <p style={{ maxWidth: 260, fontSize: '0.85rem' }}>
                The first AI-powered distributed GPU compute marketplace in Bangladesh. Greener, cheaper, smarter.
              </p>
            </div>
            {[
              { heading: 'Platform', links: ['Marketplace', 'Pricing', 'Carbon Report', 'Status'] },
              { heading: 'Providers', links: ['Get Started', 'Agent Docs', 'Trust Score', 'Payouts'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            ].map((col, i) => (
              <div key={i}>
                <div className={styles.footerHeading}>{col.heading}</div>
                {col.links.map(l => (
                  <div key={l} className={styles.footerLink}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 GreenMesh. AI GPU Compute Marketplace.</span>
            <span>Built for AI Hackathon 2026 ⚡</span>
          </div>
        </div>
      </footer>
    </>
  );
}
