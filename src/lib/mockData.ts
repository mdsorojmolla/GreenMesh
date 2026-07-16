// ============================================================
// GreenMesh — Rich Mock Data (Bangladesh-focused platform)
// Currency: BDT (Bangladeshi Taka) — 1 USD ≈ 110 BDT
// ============================================================

import type {
  User, Provider, GPUNode, Job, JobEvent, Transaction, FraudAlert,
  GPUTelemetry, PlatformStats, ProviderEarnings
} from './types';

// ---- GPU Model Catalog (prices in BDT/hr) ----
export const GPU_CATALOG = [
  { model: 'NVIDIA RTX 4090',  vram_gb: 24, cuda_cores: 16384, tflops: 82.6,  base_price: 198,  tier: 'ultra' },
  { model: 'NVIDIA RTX 4080',  vram_gb: 16, cuda_cores: 9728,  tflops: 48.7,  base_price: 121,  tier: 'high'  },
  { model: 'NVIDIA RTX 3090',  vram_gb: 24, cuda_cores: 10496, tflops: 35.6,  base_price: 99,   tier: 'high'  },
  { model: 'NVIDIA A100 80GB', vram_gb: 80, cuda_cores: 6912,  tflops: 77.6,  base_price: 385,  tier: 'ultra' },
  { model: 'NVIDIA A100 40GB', vram_gb: 40, cuda_cores: 6912,  tflops: 77.6,  base_price: 242,  tier: 'ultra' },
  { model: 'NVIDIA RTX 3080',  vram_gb: 10, cuda_cores: 8704,  tflops: 29.8,  base_price: 60,   tier: 'mid'   },
  { model: 'NVIDIA RTX 3070',  vram_gb: 8,  cuda_cores: 5888,  tflops: 20.3,  base_price: 38,   tier: 'mid'   },
  { model: 'AMD RX 7900 XTX',  vram_gb: 24, cuda_cores: 12288, tflops: 61.4,  base_price: 104,  tier: 'high'  },
  { model: 'NVIDIA H100',      vram_gb: 80, cuda_cores: 16896, tflops: 204.9, base_price: 715,  tier: 'titan' },
  { model: 'NVIDIA RTX 4070',  vram_gb: 12, cuda_cores: 5888,  tflops: 29.1,  base_price: 50,   tier: 'mid'   },
  { model: 'NVIDIA RTX 3060',  vram_gb: 12, cuda_cores: 3584,  tflops: 12.7,  base_price: 22,   tier: 'entry' },
  { model: 'NVIDIA GTX 1080 Ti',vram_gb: 11, cuda_cores: 3584, tflops: 11.3,  base_price: 16,   tier: 'entry' },
];

// ---- Carbon Intensity Lookup Table (§6.4 v0) ----
export const CARBON_REGIONS: Record<string, { gco2_kwh: number; renewable_pct: number; region: string }> = {
  'Bangladesh':      { gco2_kwh: 612, renewable_pct: 4,  region: 'ap-south'    },
  'Iceland':         { gco2_kwh: 28,  renewable_pct: 99, region: 'eu-north'    },
  'Norway':          { gco2_kwh: 26,  renewable_pct: 98, region: 'eu-north'    },
  'France':          { gco2_kwh: 56,  renewable_pct: 78, region: 'eu-west'     },
  'Sweden':          { gco2_kwh: 45,  renewable_pct: 85, region: 'eu-north'    },
  'Germany':         { gco2_kwh: 350, renewable_pct: 45, region: 'eu-central'  },
  'United Kingdom':  { gco2_kwh: 225, renewable_pct: 55, region: 'eu-west'     },
  'United States':   { gco2_kwh: 386, renewable_pct: 25, region: 'us-east'     },
  'Canada':          { gco2_kwh: 155, renewable_pct: 65, region: 'us-north'    },
  'Japan':           { gco2_kwh: 471, renewable_pct: 22, region: 'ap-east'     },
  'South Korea':     { gco2_kwh: 415, renewable_pct: 18, region: 'ap-east'     },
  'Australia':       { gco2_kwh: 601, renewable_pct: 12, region: 'ap-south'    },
  'Singapore':       { gco2_kwh: 408, renewable_pct: 20, region: 'ap-southeast'},
  'India':           { gco2_kwh: 721, renewable_pct: 10, region: 'ap-south'    },
  'Brazil':          { gco2_kwh: 89,  renewable_pct: 83, region: 'sa-east'     },
  'Netherlands':     { gco2_kwh: 290, renewable_pct: 42, region: 'eu-west'     },
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3600000).toISOString();
}

// ---- Users (Bangladesh-focused) ----
export const MOCK_USERS: User[] = [
  { id: 'user-admin-001', email: 'admin@greenmesh.io',             role: ['admin'],               org_name: 'GreenMesh Team',            created_at: daysAgo(120) },
  { id: 'user-con-001',   email: 'rahul@buet.ac.bd',               role: ['consumer'],            org_name: 'BUET CS Lab',               created_at: daysAgo(90)  },
  { id: 'user-con-002',   email: 'fatema@du.ac.bd',                role: ['consumer'],            org_name: 'Dhaka University AI Group', created_at: daysAgo(60)  },
  { id: 'user-con-003',   email: 'imran@northsouth.edu',           role: ['consumer'],            org_name: 'NSU Research Lab',          created_at: daysAgo(45)  },
  { id: 'user-con-004',   email: 'nisha@bracuniversity.ac.bd',     role: ['consumer'],            org_name: 'BRAC ML Society',           created_at: daysAgo(30)  },
  { id: 'user-pro-001',   email: 'habib@techbd.io',                role: ['provider'],            org_name: 'TechBD Compute',            created_at: daysAgo(100) },
  { id: 'user-pro-002',   email: 'sakib@dgrid.com.bd',             role: ['provider'],            org_name: 'DGrid Solutions',           created_at: daysAgo(95)  },
  { id: 'user-pro-003',   email: 'nadia@oslo-hpc.no',              role: ['provider'],            org_name: 'Oslo University HPC',       created_at: daysAgo(80)  },
  { id: 'user-pro-004',   email: 'rahim@homelab.bd',               role: ['provider'],            org_name: 'Rahim HomeCloud BD',        created_at: daysAgo(55)  },
  { id: 'user-pro-005',   email: 'tanvir@cloudbd.com',             role: ['provider'],            org_name: 'CloudBD Paris',             created_at: daysAgo(40)  },
  { id: 'user-both-001',  email: 'anika@bcsirt.bd',                role: ['consumer', 'provider'],org_name: 'BD-CSIRT Research',         created_at: daysAgo(70)  },
];

// ---- Providers (BDT monthly_earnings) ----
export const MOCK_PROVIDERS: Provider[] = [
  {
    id: 'prov-001', user_id: 'user-pro-001', display_name: 'TechBD Compute',
    location_country: 'Bangladesh', location_city: 'Dhaka',
    verified: true, trust_score: 78.5, uptime_pct: 92.0,
    job_success_rate: 0.93, avg_review_score: 4.2, disconnect_rate: 0.07,
    created_at: daysAgo(100), monthly_earnings: 32400, total_jobs_hosted: 184,
  },
  {
    id: 'prov-002', user_id: 'user-pro-002', display_name: 'DGrid Solutions BD',
    location_country: 'Bangladesh', location_city: 'Chittagong',
    verified: true, trust_score: 84.1, uptime_pct: 96.5,
    job_success_rate: 0.95, avg_review_score: 4.4, disconnect_rate: 0.04,
    created_at: daysAgo(95), monthly_earnings: 58600, total_jobs_hosted: 421,
  },
  {
    id: 'prov-003', user_id: 'user-pro-003', display_name: 'Oslo HPC Cluster',
    location_country: 'Norway', location_city: 'Oslo',
    verified: true, trust_score: 96.8, uptime_pct: 99.8,
    job_success_rate: 0.99, avg_review_score: 4.9, disconnect_rate: 0.002,
    created_at: daysAgo(80), monthly_earnings: 638000, total_jobs_hosted: 890,
  },
  {
    id: 'prov-004', user_id: 'user-pro-004', display_name: 'Rahim HomeCloud BD',
    location_country: 'Bangladesh', location_city: 'Sylhet',
    verified: true, trust_score: 68.3, uptime_pct: 85.0,
    job_success_rate: 0.84, avg_review_score: 3.7, disconnect_rate: 0.15,
    created_at: daysAgo(55), monthly_earnings: 14200, total_jobs_hosted: 52,
  },
  {
    id: 'prov-005', user_id: 'user-pro-005', display_name: 'CloudBD (France Mirror)',
    location_country: 'France', location_city: 'Paris',
    verified: true, trust_score: 85.4, uptime_pct: 97.2,
    job_success_rate: 0.95, avg_review_score: 4.3, disconnect_rate: 0.05,
    created_at: daysAgo(40), monthly_earnings: 231000, total_jobs_hosted: 334,
  },
  {
    id: 'prov-006', user_id: 'user-both-001', display_name: 'BD-CSIRT Lab Cluster',
    location_country: 'Bangladesh', location_city: 'Rajshahi',
    verified: true, trust_score: 80.2, uptime_pct: 93.0,
    job_success_rate: 0.92, avg_review_score: 4.1, disconnect_rate: 0.06,
    created_at: daysAgo(70), monthly_earnings: 27500, total_jobs_hosted: 148,
  },
];

// ---- GPU Nodes (prices in BDT/hr) ----
export const MOCK_GPU_NODES: GPUNode[] = [
  // TechBD Compute (Dhaka, BD)
  {
    id: 'node-001', provider_id: 'prov-001', gpu_model: 'NVIDIA RTX 4090',
    vram_gb: 24, driver_version: '545.29.06', benchmark_score: 96.4,
    hourly_price: 190, status: 'idle', carbon_intensity_gco2_kwh: 612,
    last_heartbeat: hoursAgo(0.01), created_at: daysAgo(100),
    region: 'ap-south', latency_ms: 15, cuda_cores: 16384, tflops: 82.6,
  },
  {
    id: 'node-002', provider_id: 'prov-001', gpu_model: 'NVIDIA RTX 3080',
    vram_gb: 10, driver_version: '545.29.06', benchmark_score: 71.2,
    hourly_price: 58, status: 'busy', carbon_intensity_gco2_kwh: 612,
    last_heartbeat: hoursAgo(0.01), created_at: daysAgo(100),
    region: 'ap-south', latency_ms: 15, cuda_cores: 8704, tflops: 29.8,
  },
  // DGrid Solutions (Chittagong, BD)
  {
    id: 'node-003', provider_id: 'prov-002', gpu_model: 'NVIDIA RTX 4080',
    vram_gb: 16, driver_version: '545.29.06', benchmark_score: 88.1,
    hourly_price: 118, status: 'idle', carbon_intensity_gco2_kwh: 612,
    last_heartbeat: hoursAgo(0.01), created_at: daysAgo(95),
    region: 'ap-south', latency_ms: 20, cuda_cores: 9728, tflops: 48.7,
  },
  {
    id: 'node-004', provider_id: 'prov-002', gpu_model: 'NVIDIA RTX 4090',
    vram_gb: 24, driver_version: '545.29.06', benchmark_score: 97.2,
    hourly_price: 195, status: 'busy', carbon_intensity_gco2_kwh: 612,
    last_heartbeat: hoursAgo(0.01), created_at: daysAgo(95),
    region: 'ap-south', latency_ms: 20, cuda_cores: 16384, tflops: 82.6,
  },
  // Oslo HPC (Norway — very green, available for BD students via partnership)
  {
    id: 'node-005', provider_id: 'prov-003', gpu_model: 'NVIDIA H100',
    vram_gb: 80, driver_version: '525.105.17', benchmark_score: 99.9,
    hourly_price: 682, status: 'idle', carbon_intensity_gco2_kwh: 26,
    last_heartbeat: hoursAgo(0.01), created_at: daysAgo(80),
    region: 'eu-north', latency_ms: 210, cuda_cores: 16896, tflops: 204.9,
  },
  {
    id: 'node-006', provider_id: 'prov-003', gpu_model: 'NVIDIA A100 80GB',
    vram_gb: 80, driver_version: '525.105.17', benchmark_score: 99.5,
    hourly_price: 374, status: 'idle', carbon_intensity_gco2_kwh: 26,
    last_heartbeat: hoursAgo(0.01), created_at: daysAgo(80),
    region: 'eu-north', latency_ms: 210, cuda_cores: 6912, tflops: 77.6,
  },
  {
    id: 'node-007', provider_id: 'prov-003', gpu_model: 'NVIDIA RTX 3090',
    vram_gb: 24, driver_version: '525.105.17', benchmark_score: 90.1,
    hourly_price: 94, status: 'busy', carbon_intensity_gco2_kwh: 26,
    last_heartbeat: hoursAgo(0.01), created_at: daysAgo(80),
    region: 'eu-north', latency_ms: 210, cuda_cores: 10496, tflops: 35.6,
  },
  // Rahim HomeCloud (Sylhet, BD)
  {
    id: 'node-008', provider_id: 'prov-004', gpu_model: 'NVIDIA RTX 3070',
    vram_gb: 8, driver_version: '525.89.02', benchmark_score: 64.5,
    hourly_price: 35, status: 'idle', carbon_intensity_gco2_kwh: 612,
    last_heartbeat: hoursAgo(0.5), created_at: daysAgo(55),
    region: 'ap-south', latency_ms: 25, cuda_cores: 5888, tflops: 20.3,
  },
  {
    id: 'node-009', provider_id: 'prov-004', gpu_model: 'NVIDIA RTX 3060',
    vram_gb: 12, driver_version: '525.89.02', benchmark_score: 55.8,
    hourly_price: 22, status: 'offline', carbon_intensity_gco2_kwh: 612,
    last_heartbeat: hoursAgo(4), created_at: daysAgo(55),
    region: 'ap-south', latency_ms: 25, cuda_cores: 3584, tflops: 12.7,
  },
  // CloudBD France Mirror (low carbon)
  {
    id: 'node-010', provider_id: 'prov-005', gpu_model: 'NVIDIA RTX 4090',
    vram_gb: 24, driver_version: '545.29.06', benchmark_score: 97.8,
    hourly_price: 187, status: 'idle', carbon_intensity_gco2_kwh: 56,
    last_heartbeat: hoursAgo(0.01), created_at: daysAgo(40),
    region: 'eu-west', latency_ms: 280, cuda_cores: 16384, tflops: 82.6,
  },
  {
    id: 'node-011', provider_id: 'prov-005', gpu_model: 'NVIDIA A100 40GB',
    vram_gb: 40, driver_version: '525.105.17', benchmark_score: 98.2,
    hourly_price: 226, status: 'idle', carbon_intensity_gco2_kwh: 56,
    last_heartbeat: hoursAgo(0.01), created_at: daysAgo(40),
    region: 'eu-west', latency_ms: 280, cuda_cores: 6912, tflops: 77.6,
  },
  // BD-CSIRT Rajshahi
  {
    id: 'node-012', provider_id: 'prov-006', gpu_model: 'NVIDIA RTX 4080',
    vram_gb: 16, driver_version: '525.89.02', benchmark_score: 83.5,
    hourly_price: 112, status: 'degraded', carbon_intensity_gco2_kwh: 612,
    last_heartbeat: hoursAgo(0.1), created_at: daysAgo(70),
    region: 'ap-south', latency_ms: 30, cuda_cores: 9728, tflops: 48.7,
  },
];

// ---- Jobs (BDT costs) ----
export const MOCK_JOBS: Job[] = [
  {
    id: 'job-001', consumer_id: 'user-con-001', gpu_node_id: 'node-005',
    status: 'running', container_image: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',
    requested_vram_gb: 40, priority: 'carbon_optimized',
    estimated_cost: 2728, started_at: hoursAgo(4), created_at: hoursAgo(4.1),
    progress_pct: 68, runtime_minutes: 240,
  },
  {
    id: 'job-002', consumer_id: 'user-con-002', gpu_node_id: 'node-001',
    status: 'running', container_image: 'nvcr.io/nvidia/nemo:23.10',
    requested_vram_gb: 16, priority: 'low_latency',
    estimated_cost: 380, started_at: hoursAgo(2), created_at: hoursAgo(2.05),
    progress_pct: 45, runtime_minutes: 120,
  },
  {
    id: 'job-003', consumer_id: 'user-con-003', gpu_node_id: undefined,
    status: 'queued', container_image: 'huggingface/transformers:4.35.0-pt2.1.0',
    requested_vram_gb: 24, priority: 'low_cost',
    estimated_cost: 94, created_at: hoursAgo(0.2),
    progress_pct: 0, runtime_minutes: 0,
  },
  {
    id: 'job-004', consumer_id: 'user-con-001', gpu_node_id: 'node-006',
    status: 'completed', container_image: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',
    requested_vram_gb: 40, priority: 'carbon_optimized',
    estimated_cost: 1870, actual_cost: 1795,
    started_at: daysAgo(2), completed_at: daysAgo(2), created_at: daysAgo(2),
    progress_pct: 100, runtime_minutes: 288,
  },
  {
    id: 'job-005', consumer_id: 'user-con-002', gpu_node_id: 'node-003',
    status: 'running', container_image: 'tensorflow/tensorflow:2.14.0-gpu',
    requested_vram_gb: 16, priority: 'standard',
    estimated_cost: 1386, started_at: hoursAgo(6), created_at: hoursAgo(6.1),
    progress_pct: 82, runtime_minutes: 360,
  },
  {
    id: 'job-006', consumer_id: 'user-con-004', gpu_node_id: 'node-010',
    status: 'scheduled', container_image: 'python:3.11-slim',
    requested_vram_gb: 8, priority: 'low_cost',
    estimated_cost: 187, created_at: hoursAgo(0.5),
    progress_pct: 0, runtime_minutes: 0,
  },
  {
    id: 'job-007', consumer_id: 'user-con-003', gpu_node_id: 'node-007',
    status: 'migrating', container_image: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',
    requested_vram_gb: 20, priority: 'standard',
    checkpoint_uri: 's3://greenmesh-checkpoints/job-007/ckpt-1200.pt',
    estimated_cost: 561, started_at: hoursAgo(3), created_at: hoursAgo(3.05),
    progress_pct: 55, runtime_minutes: 180,
  },
  {
    id: 'job-008', consumer_id: 'user-con-001', gpu_node_id: 'node-005',
    status: 'failed', container_image: 'nvcr.io/nvidia/tritonserver:23.09-py3',
    requested_vram_gb: 80, priority: 'low_latency',
    estimated_cost: 4092, actual_cost: 1364,
    started_at: daysAgo(1), completed_at: daysAgo(1), created_at: daysAgo(1),
    progress_pct: 33, runtime_minutes: 120,
  },
];

// ---- Fraud Alerts ----
export const MOCK_FRAUD_ALERTS: FraudAlert[] = [
  {
    id: 'fraud-001', provider_id: 'prov-004', gpu_node_id: 'node-009',
    alert_type: 'spec_mismatch', severity: 'high',
    details: { claimed_vram_gb: 12, measured_vram_gb: 8, benchmark_delta_pct: 28 },
    resolved: false, created_at: hoursAgo(12),
  },
  {
    id: 'fraud-002', provider_id: 'prov-006', gpu_node_id: 'node-012',
    alert_type: 'abnormal_disconnect', severity: 'medium',
    details: { disconnects_last_24h: 7, avg_job_duration_min: 12, expected_min_min: 60 },
    resolved: false, created_at: hoursAgo(6),
  },
  {
    id: 'fraud-003', provider_id: 'prov-001', gpu_node_id: 'node-001',
    alert_type: 'benchmark_anomaly', severity: 'low',
    details: { last_score: 88.2, baseline_score: 96.4, delta_pct: 8.5 },
    resolved: true, created_at: daysAgo(5),
  },
];

// ---- Platform Stats ----
export const MOCK_PLATFORM_STATS: PlatformStats = {
  total_nodes_online: 9,
  total_jobs_running: 3,
  total_jobs_completed_today: 47,
  avg_price_per_hour: 148,       // BDT
  carbon_saved_kg_today: 184.2,
  platform_revenue_today: 312565, // BDT
  total_providers: 6,
  total_consumers: 5,
};

// ---- Generate live telemetry for a node ----
export function generateTelemetry(nodeId: string, count = 60): GPUTelemetry[] {
  const now = Date.now();
  const isHot = nodeId === 'node-012'; // degraded node
  const base_temp = isHot ? 82 : 65;
  const base_util = nodeId === 'node-009' ? 0 : 80;

  return Array.from({ length: count }, (_, i) => ({
    time: new Date(now - (count - i) * 5000).toISOString(),
    gpu_node_id: nodeId,
    temperature_c: base_temp + randomBetween(-3, isHot ? 8 : 4),
    vram_used_gb: randomBetween(6, 20),
    power_draw_w: base_util > 0 ? randomBetween(180, 350) : randomBetween(10, 30),
    fan_speed_pct: base_temp > 78 ? randomBetween(70, 100) : randomBetween(30, 60),
    utilization_pct: base_util + randomBetween(-10, 10),
  }));
}

// ---- Provider earnings (BDT) ----
export function getProviderEarnings(providerId: string): ProviderEarnings {
  const earningsMap: Record<string, Omit<ProviderEarnings, 'provider_id'>> = {
    'prov-001': { today: 4884, this_week: 34320, this_month: 147840, all_time: 1465820, pending_payout: 34320 },
    'prov-002': { today: 11770, this_week: 82390, this_month: 353100, all_time: 3506360, pending_payout: 82390 },
    'prov-003': { today: 21274, this_week: 148940, this_month: 638000, all_time: 6185410, pending_payout: 148940 },
    'prov-004': { today: 1540, this_week: 10780, this_month: 46200, all_time: 312400, pending_payout: 10780 },
    'prov-005': { today: 7700, this_week: 53900, this_month: 231000, all_time: 1085700, pending_payout: 53900 },
    'prov-006': { today: 2860, this_week: 20020, this_month: 85800, all_time: 475200, pending_payout: 20020 },
  };
  return { provider_id: providerId, ...(earningsMap[providerId] ?? { today: 0, this_week: 0, this_month: 0, all_time: 0, pending_payout: 0 }) };
}

// ---- Job Events timeline ----
export const MOCK_JOB_EVENTS: JobEvent[] = [
  { id: 1,  job_id: 'job-001', event_type: 'queued',           metadata: {}, created_at: hoursAgo(4.1)   },
  { id: 2,  job_id: 'job-001', event_type: 'scheduled',        metadata: { node_id: 'node-005', scheduler_score: 94.2 }, created_at: hoursAgo(4.05) },
  { id: 3,  job_id: 'job-001', event_type: 'checkpoint_saved', metadata: { uri: 's3://ckpt/job-001/ckpt-0600.pt', step: 600 }, created_at: hoursAgo(3) },
  { id: 4,  job_id: 'job-001', event_type: 'checkpoint_saved', metadata: { uri: 's3://ckpt/job-001/ckpt-1200.pt', step: 1200 }, created_at: hoursAgo(2) },
  { id: 5,  job_id: 'job-007', event_type: 'queued',           metadata: {}, created_at: hoursAgo(3.05)  },
  { id: 6,  job_id: 'job-007', event_type: 'scheduled',        metadata: { node_id: 'node-007' }, created_at: hoursAgo(3)   },
  { id: 7,  job_id: 'job-007', event_type: 'checkpoint_saved', metadata: { uri: 's3://ckpt/job-007/ckpt-1200.pt' }, created_at: hoursAgo(1) },
  { id: 8,  job_id: 'job-007', event_type: 'migrated',         metadata: { from_node: 'node-007', reason: 'node_degraded', to_node: 'node-010' }, created_at: hoursAgo(0.3) },
];
