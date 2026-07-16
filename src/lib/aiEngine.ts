// ============================================================
// GreenMesh — AI Intelligence Layer (v0 Rule-Based)
// All 6 subsystems from §6 of the master build spec
// ============================================================

import type {
  GPUNode, Job, SchedulerScore, SchedulerWeights,
  PriceBand, HealthAlert, Provider,
} from './types';
import { CARBON_REGIONS } from './mockData';

// ============================================================
// §6.1 — AI SCHEDULER (Weighted Scoring v0)
// score(node) = w1*norm(1/price) + w2*norm(trust) + w3*norm(-carbon)
//             + w4*norm(-latency) + w5*norm(vram_headroom)
// ============================================================

const PRIORITY_WEIGHTS: Record<string, SchedulerWeights> = {
  standard:        { w_price: 0.20, w_trust: 0.25, w_carbon: 0.15, w_latency: 0.20, w_vram: 0.20 },
  low_cost:        { w_price: 0.50, w_trust: 0.15, w_carbon: 0.05, w_latency: 0.15, w_vram: 0.15 },
  carbon_optimized:{ w_price: 0.10, w_trust: 0.20, w_carbon: 0.50, w_latency: 0.10, w_vram: 0.10 },
  low_latency:     { w_price: 0.15, w_trust: 0.20, w_carbon: 0.05, w_latency: 0.45, w_vram: 0.15 },
};

function normalize(values: number[], invert = false): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map(v => invert ? 1 - (v - min) / (max - min) : (v - min) / (max - min));
}

export function runScheduler(
  nodes: GPUNode[],
  job: Partial<Job>,
  providers: Provider[],
  priority: string = 'standard'
): SchedulerScore[] {
  const weights = PRIORITY_WEIGHTS[priority] ?? PRIORITY_WEIGHTS.standard;

  // Filter eligible nodes
  const eligible = nodes.filter(n =>
    n.status === 'idle' &&
    n.vram_gb >= (job.requested_vram_gb ?? 0)
  );

  if (eligible.length === 0) return [];

  const providerMap = new Map(providers.map(p => [p.id, p]));

  // Extract raw values
  const prices    = eligible.map(n => n.hourly_price);
  const trusts    = eligible.map(n => providerMap.get(n.provider_id)?.trust_score ?? 50);
  const carbons   = eligible.map(n => n.carbon_intensity_gco2_kwh);
  const latencies = eligible.map(n => n.latency_ms ?? 100);
  const vrams     = eligible.map(n => n.vram_gb - (job.requested_vram_gb ?? 0));

  // Normalize
  const priceNorm   = normalize(prices, true);   // lower price = higher score
  const trustNorm   = normalize(trusts);
  const carbonNorm  = normalize(carbons, true);  // lower carbon = higher score
  const latencyNorm = normalize(latencies, true); // lower latency = higher score
  const vramNorm    = normalize(vrams);           // more headroom = higher score

  const results: SchedulerScore[] = eligible.map((node, i) => {
    const score =
      weights.w_price   * priceNorm[i]   +
      weights.w_trust   * trustNorm[i]   +
      weights.w_carbon  * carbonNorm[i]  +
      weights.w_latency * latencyNorm[i] +
      weights.w_vram    * vramNorm[i];

    return {
      node_id: node.id,
      score: Math.round(score * 1000) / 10, // 0-100
      breakdown: {
        price_score:   Math.round(priceNorm[i]   * 100),
        trust_score:   Math.round(trustNorm[i]   * 100),
        carbon_score:  Math.round(carbonNorm[i]  * 100),
        latency_score: Math.round(latencyNorm[i] * 100),
        vram_score:    Math.round(vramNorm[i]    * 100),
      },
      rank: 0,
    };
  });

  // Sort descending and assign rank
  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => { r.rank = i + 1; });

  return results;
}

// ============================================================
// §6.2 — GPU HEALTH ENGINE (v0 — threshold-based alerts)
// ============================================================

interface TelemetryPoint {
  temperature_c: number;
  power_draw_w: number;
  fan_speed_pct: number;
  utilization_pct: number;
  vram_used_gb: number;
}

const HEALTH_THRESHOLDS = {
  temp_warning:  82,
  temp_critical: 90,
  power_warning: 340,
  fan_warning:   95,
  util_sustained: 99, // sustained 100% can indicate stuck process
};

export function checkNodeHealth(nodeId: string, recent: TelemetryPoint[]): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  if (!recent.length) return alerts;

  const latest = recent[recent.length - 1];
  const avgTemp = recent.slice(-6).reduce((s, r) => s + r.temperature_c, 0) / Math.min(recent.length, 6);
  const tempRateOfChange = recent.length > 2
    ? (recent[recent.length - 1].temperature_c - recent[recent.length - 3].temperature_c) / 2
    : 0;

  // Temperature warning
  if (latest.temperature_c >= HEALTH_THRESHOLDS.temp_critical) {
    alerts.push({
      node_id: nodeId, alert_type: 'high_temperature', severity: 'critical',
      value: latest.temperature_c, threshold: HEALTH_THRESHOLDS.temp_critical,
      message: `GPU temperature critical: ${latest.temperature_c.toFixed(1)}°C`,
      timestamp: new Date().toISOString(),
    });
  } else if (latest.temperature_c >= HEALTH_THRESHOLDS.temp_warning) {
    alerts.push({
      node_id: nodeId, alert_type: 'high_temperature', severity: 'warning',
      value: latest.temperature_c, threshold: HEALTH_THRESHOLDS.temp_warning,
      message: `GPU temperature elevated: ${latest.temperature_c.toFixed(1)}°C`,
      timestamp: new Date().toISOString(),
    });
  }

  // Rapid temperature rise
  if (tempRateOfChange > 2.0) {
    alerts.push({
      node_id: nodeId, alert_type: 'rapid_temp_rise', severity: 'warning',
      value: tempRateOfChange, threshold: 2.0,
      message: `Temperature rising rapidly: +${tempRateOfChange.toFixed(1)}°C/sample`,
      timestamp: new Date().toISOString(),
    });
  }

  // Power draw
  if (latest.power_draw_w >= HEALTH_THRESHOLDS.power_warning) {
    alerts.push({
      node_id: nodeId, alert_type: 'high_power_draw', severity: 'warning',
      value: latest.power_draw_w, threshold: HEALTH_THRESHOLDS.power_warning,
      message: `High power draw: ${latest.power_draw_w.toFixed(0)}W`,
      timestamp: new Date().toISOString(),
    });
  }

  // Fan speed maxed out
  if (latest.fan_speed_pct >= HEALTH_THRESHOLDS.fan_warning) {
    alerts.push({
      node_id: nodeId, alert_type: 'fan_maxed', severity: 'warning',
      value: latest.fan_speed_pct, threshold: HEALTH_THRESHOLDS.fan_warning,
      message: `Fan speed at maximum: ${latest.fan_speed_pct.toFixed(0)}%`,
      timestamp: new Date().toISOString(),
    });
  }

  return alerts;
}

// ============================================================
// §6.4 — CARBON PREDICTION (v0 — static lookup)
// ============================================================

export function getCarbonIntensity(country: string): number {
  return CARBON_REGIONS[country]?.gco2_kwh ?? 400; // global average fallback
}

export function estimateJobCarbonKg(
  runtimeHours: number,
  powerDrawW: number,
  carbonIntensityGco2Kwh: number
): number {
  const energyKwh = (powerDrawW / 1000) * runtimeHours;
  return (energyKwh * carbonIntensityGco2Kwh) / 1000;
}

export function getCarbonScore(gco2_kwh: number): { label: string; color: string; score: number } {
  if (gco2_kwh < 80)  return { label: 'Ultra Green',  color: '#00ff88', score: 100 };
  if (gco2_kwh < 200) return { label: 'Green',        color: '#22c55e', score: 80  };
  if (gco2_kwh < 350) return { label: 'Moderate',     color: '#f59e0b', score: 55  };
  if (gco2_kwh < 500) return { label: 'High',         color: '#ef4444', score: 30  };
  return               { label: 'Very High',    color: '#dc2626', score: 10  };
}

// ============================================================
// §6.5 — PRICING AI (v0 — supply/demand bands)
// ============================================================

const BASE_RATE_CARD: Record<string, { floor: number; ceiling: number }> = {
  titan: { floor: 440,  ceiling: 1100 },
  ultra: { floor: 165,  ceiling: 440  },
  high:  { floor: 88,   ceiling: 220  },
  mid:   { floor: 28,   ceiling: 83   },
  entry: { floor: 9,    ceiling: 33   },
};

export function getPriceBand(
  gpuTier: string,
  totalIdleNodes: number,
  totalPendingJobs: number
): PriceBand {
  const band = BASE_RATE_CARD[gpuTier] ?? BASE_RATE_CARD.mid;
  const demandRatio = totalPendingJobs / Math.max(totalIdleNodes, 1);

  // Supply/demand multiplier: 0.8x (surplus) to 1.4x (scarce)
  const multiplier = Math.min(1.4, Math.max(0.8, 0.8 + demandRatio * 0.3));
  const recommended = +((band.floor + band.ceiling) / 2 * multiplier).toFixed(2);

  return {
    gpu_tier: gpuTier,
    floor: band.floor,
    ceiling: band.ceiling,
    recommended,
    demand_multiplier: multiplier,
  };
}

// ============================================================
// §6.6 — TRUST SCORE (v0 — weighted formula)
// trust = 100 * (0.4*uptime + 0.3*success_rate + 0.2*review_norm + 0.1*(1-disconnect_rate))
// ============================================================

export function computeTrustScore(params: {
  uptime_pct: number;       // 0-100
  job_success_rate: number; // 0-1
  avg_review_score: number; // 1-5
  disconnect_rate: number;  // 0-1
}): number {
  const uptime       = params.uptime_pct / 100;
  const success      = params.job_success_rate;
  const review       = (params.avg_review_score - 1) / 4; // normalize 1-5 → 0-1
  const reliability  = 1 - params.disconnect_rate;

  const score = 100 * (
    0.4 * uptime     +
    0.3 * success    +
    0.2 * review     +
    0.1 * reliability
  );

  return Math.min(100, Math.max(0, Math.round(score * 10) / 10));
}

export function getTrustLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Exceptional',  color: '#00ff88' };
  if (score >= 80) return { label: 'Trusted',      color: '#22c55e' };
  if (score >= 65) return { label: 'Good',         color: '#a3e635' };
  if (score >= 50) return { label: 'Fair',         color: '#f59e0b' };
  return                  { label: 'Low Trust',    color: '#ef4444' };
}

// ============================================================
// §6.7 — FRAUD DETECTION (v0 — rule engine)
// ============================================================

interface FraudCheck {
  passed: boolean;
  severity?: 'low' | 'medium' | 'high';
  alert_type?: string;
  details: Record<string, unknown>;
}

export function checkSpecMismatch(params: {
  claimed_vram_gb: number;
  measured_vram_gb: number;
  claimed_benchmark: number;
  measured_benchmark: number;
}): FraudCheck {
  const vramDelta = Math.abs(params.claimed_vram_gb - params.measured_vram_gb) / params.claimed_vram_gb;
  const benchDelta = Math.abs(params.claimed_benchmark - params.measured_benchmark) / params.claimed_benchmark;

  if (vramDelta > 0.20 || benchDelta > 0.25) {
    return {
      passed: false,
      severity: vramDelta > 0.30 ? 'high' : 'medium',
      alert_type: 'spec_mismatch',
      details: {
        vram_delta_pct: +(vramDelta * 100).toFixed(1),
        bench_delta_pct: +(benchDelta * 100).toFixed(1),
        ...params,
      },
    };
  }
  return { passed: true, details: {} };
}

export function checkDisconnectFrequency(params: {
  disconnects_last_24h: number;
  jobs_last_24h: number;
}): FraudCheck {
  const disconnectRate = params.disconnects_last_24h / Math.max(params.jobs_last_24h, 1);

  if (params.disconnects_last_24h >= 5 || disconnectRate > 0.40) {
    return {
      passed: false,
      severity: disconnectRate > 0.6 ? 'high' : 'medium',
      alert_type: 'abnormal_disconnect',
      details: { disconnect_rate_pct: +(disconnectRate * 100).toFixed(1), ...params },
    };
  }
  return { passed: true, details: {} };
}

// ============================================================
// §6.3 — WORKLOAD FORECASTING (v0 — moving average)
// ============================================================

export function forecastDemand(historicalHourlyJobs: number[]): number {
  if (historicalHourlyJobs.length === 0) return 0;
  const window = historicalHourlyJobs.slice(-24); // last 24 hours
  const avg = window.reduce((s, v) => s + v, 0) / window.length;

  // Simple day-of-week seasonal: weekdays ~1.3x, weekends ~0.7x
  const dayOfWeek = new Date().getDay();
  const seasonal = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.3;

  return Math.round(avg * seasonal);
}
