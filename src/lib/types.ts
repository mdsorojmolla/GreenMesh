// ============================================================
// GreenMesh — Shared TypeScript Types
// Mirrors the PostgreSQL schema in §4 of the master build spec
// ============================================================

export type UserRole = 'consumer' | 'provider' | 'admin';
export type NodeStatus = 'offline' | 'idle' | 'busy' | 'degraded' | 'banned';
export type JobStatus =
  | 'queued'
  | 'scheduled'
  | 'running'
  | 'migrating'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type PriorityMode = 'standard' | 'low_cost' | 'carbon_optimized' | 'low_latency';
export type TransactionStatus = 'pending' | 'held_escrow' | 'released' | 'refunded';
export type FraudAlertType = 'spec_mismatch' | 'abnormal_disconnect' | 'benchmark_anomaly';
export type FraudAlertSeverity = 'low' | 'medium' | 'high';
export type JobEventType =
  | 'scheduled'
  | 'checkpoint_saved'
  | 'migrated'
  | 'resumed'
  | 'failed'
  | 'completed'
  | 'queued';

export interface User {
  id: string;
  email: string;
  role: UserRole[];
  org_name?: string;
  created_at: string;
}

export interface Provider {
  id: string;
  user_id: string;
  display_name: string;
  location_country: string;
  location_city?: string;
  verified: boolean;
  trust_score: number; // 0–100
  uptime_pct: number;
  job_success_rate: number;
  avg_review_score: number;
  disconnect_rate: number;
  created_at: string;
  // computed
  monthly_earnings?: number;
  total_jobs_hosted?: number;
}

export interface GPUNode {
  id: string;
  provider_id: string;
  gpu_model: string;
  vram_gb: number;
  driver_version: string;
  benchmark_score: number;
  hourly_price: number; // USD
  status: NodeStatus;
  carbon_intensity_gco2_kwh: number;
  last_heartbeat: string;
  created_at: string;
  // enriched
  provider?: Provider;
  region?: string;
  latency_ms?: number;
  cuda_cores?: number;
  tflops?: number;
}

export interface Job {
  id: string;
  consumer_id: string;
  gpu_node_id?: string;
  status: JobStatus;
  container_image: string;
  requested_vram_gb: number;
  priority: PriorityMode;
  checkpoint_uri?: string;
  estimated_cost: number;
  actual_cost?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  // enriched
  gpu_node?: GPUNode;
  progress_pct?: number;
  runtime_minutes?: number;
}

export interface JobEvent {
  id: number;
  job_id: string;
  event_type: JobEventType;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GPUTelemetry {
  time: string;
  gpu_node_id: string;
  temperature_c: number;
  vram_used_gb: number;
  power_draw_w: number;
  fan_speed_pct: number;
  utilization_pct: number;
}

export interface Transaction {
  id: string;
  job_id: string;
  consumer_id: string;
  provider_id: string;
  amount: number;
  platform_fee: number;
  status: TransactionStatus;
  created_at: string;
}

export interface FraudAlert {
  id: string;
  provider_id: string;
  gpu_node_id?: string;
  alert_type: FraudAlertType;
  severity: FraudAlertSeverity;
  details: Record<string, unknown>;
  resolved: boolean;
  created_at: string;
  // enriched
  provider?: Provider;
  node?: GPUNode;
}

// ---- AI Subsystem types ----

export interface SchedulerScore {
  node_id: string;
  score: number;
  breakdown: {
    price_score: number;
    trust_score: number;
    carbon_score: number;
    latency_score: number;
    vram_score: number;
  };
  rank: number;
}

export interface SchedulerWeights {
  w_price: number;
  w_trust: number;
  w_carbon: number;
  w_latency: number;
  w_vram: number;
}

export interface PriceBand {
  gpu_tier: string;
  floor: number;
  ceiling: number;
  recommended: number;
  demand_multiplier: number;
}

export interface CarbonRegion {
  country: string;
  region: string;
  gco2_kwh: number;
  source: string;
  renewable_pct: number;
}

export interface HealthAlert {
  node_id: string;
  alert_type: string;
  severity: 'warning' | 'critical';
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
}

// ---- Dashboard summary types ----

export interface PlatformStats {
  total_nodes_online: number;
  total_jobs_running: number;
  total_jobs_completed_today: number;
  avg_price_per_hour: number;
  carbon_saved_kg_today: number;
  platform_revenue_today: number;
  total_providers: number;
  total_consumers: number;
}

export interface ProviderEarnings {
  provider_id: string;
  today: number;
  this_week: number;
  this_month: number;
  all_time: number;
  pending_payout: number;
}
