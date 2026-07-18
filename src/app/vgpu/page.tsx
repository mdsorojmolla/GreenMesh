'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { MOCK_GPU_NODES, MOCK_PROVIDERS, generateTelemetry } from '@/lib/mockData';
import { getCarbonScore } from '@/lib/aiEngine';
import type { GPUTelemetry } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = 'terminal' | 'metrics' | 'jobs' | 'logs';

interface TerminalLine {
  id: number;
  type: 'input' | 'output' | 'error' | 'info' | 'success' | 'system';
  text: string;
  delay?: number;
}

interface VJob {
  id: string;
  image: string;
  vram: number;
  started: Date;
  progress: number;
  status: 'running' | 'completed' | 'queued';
  checkpoints: number;
  logs: string[];
}

// ── Terminal Command Engine ─────────────────────────────────────────────────

const IDLE_NODE = MOCK_GPU_NODES.find(n => n.status === 'idle') ?? MOCK_GPU_NODES[0];
const PROVIDER  = MOCK_PROVIDERS.find(p => p.id === IDLE_NODE.provider_id)!;

function buildNvidiaSmi(telemetry: GPUTelemetry | undefined): string[] {
  const t = telemetry;
  const temp = t ? t.temperature_c.toFixed(1) : '65.0';
  const power = t ? t.power_draw_w.toFixed(0) : '180';
  const vram = t ? t.vram_used_gb.toFixed(0) : '0';
  const util = t ? t.utilization_pct.toFixed(0) : '0';

  return [
    `+-----------------------------------------------------------------------------------------+`,
    `| NVIDIA-SMI 545.29.06    Driver Version: 545.29.06    CUDA Version: 12.3               |`,
    `+-------------------------------+----------------------+----------------------------------+`,
    `| GPU  Name                Temp | Power  Usage/Cap     | MEM-Usage  GPU-Util             |`,
    `|===============================+======================+==================================|`,
    `|   0  ${IDLE_NODE.gpu_model.padEnd(18)}  ${temp}C | ${power.padStart(3)}W / 450W      | ${vram.padStart(2)}GB / ${IDLE_NODE.vram_gb}GB   ${util.padStart(3)}%  MIG N/A |`,
    `+-------------------------------+----------------------+----------------------------------+`,
    `|  Processes:                                                                             |`,
    `|  GPU   GI   CI        PID   Type   Process name                            GPU Memory  |`,
    `|        ID   ID                                                              Usage       |`,
    `|=========================================================================================|`,
    `|   No running processes found.                                                           |`,
    `+-----------------------------------------------------------------------------------------+`,
  ];
}

const STATIC_COMMANDS: Record<string, (args: string[], telemetry?: GPUTelemetry) => string[]> = {
  help: () => [
    '',
    '  \x1b[32mAvailable Commands\x1b[0m',
    '  ─────────────────────────────────────────────────',
    '  nvidia-smi          Show GPU status and utilization',
    '  python train.py     Launch a training job simulation',
    '  ls [path]           List workspace files',
    '  cat [file]          Print file contents',
    '  df -h               Show disk usage',
    '  free -h             Show memory usage',
    '  ps aux              List running processes',
    '  top                 Interactive process viewer (simulated)',
    '  env                 Show environment variables',
    '  curl ifconfig.me    Show your sandboxed external IP',
    '  echo [text]         Echo text',
    '  clear               Clear terminal',
    '  whoami              Current user',
    '  pwd                 Print working directory',
    '  uname -a            System information',
    '',
  ],
  ls: (args) => {
    const path = args[0] ?? '/workspace';
    if (path === '/workspace' || path === '.') {
      return [
        'total 48',
        'drwxr-xr-x 4 runner runner 4096 Jul 17 17:32 \x1b[34m.\x1b[0m',
        'drwxr-xr-x 1 runner runner 4096 Jul 17 17:30 \x1b[34m..\x1b[0m',
        '-rw-r--r-- 1 runner runner 2847 Jul 17 17:31 config.yaml',
        '-rw-r--r-- 1 runner runner 8192 Jul 17 17:31 dataset.pkl',
        'drwxr-xr-x 2 runner runner 4096 Jul 17 17:31 \x1b[34mcheckpoints\x1b[0m',
        '-rw-r--r-- 1 runner runner 1048 Jul 17 17:31 requirements.txt',
        '-rwxr-xr-x 1 runner runner 3721 Jul 17 17:31 \x1b[32mtrain.py\x1b[0m',
        'drwxr-xr-x 2 runner runner 4096 Jul 17 17:32 \x1b[34mlogs\x1b[0m',
        '-rw-r--r-- 1 runner runner  512 Jul 17 17:31 README.md',
      ];
    }
    if (path === 'checkpoints' || path === '/workspace/checkpoints') {
      return [
        '-rw-r--r-- 1 runner runner 124M Jul 17 17:35 ckpt-step-0600.pt',
        '-rw-r--r-- 1 runner runner 124M Jul 17 17:40 ckpt-step-1200.pt',
        '-rw-r--r-- 1 runner runner 124M Jul 17 17:45 ckpt-step-1800.pt',
      ];
    }
    return [`ls: cannot access '${path}': No such file or directory`];
  },
  cat: (args) => {
    const file = args[0] ?? '';
    if (file === 'config.yaml') {
      return [
        '# GreenMesh Training Config',
        'model:',
        '  name: llama-3-8b',
        '  architecture: transformer',
        '  hidden_size: 4096',
        '  num_layers: 32',
        '  num_heads: 32',
        '',
        'training:',
        '  batch_size: 8',
        '  learning_rate: 3.0e-4',
        '  max_steps: 10000',
        '  warmup_steps: 500',
        '  checkpoint_every: 600',
        '  output_dir: /workspace/checkpoints',
        '',
        'hardware:',
        `  gpu: ${IDLE_NODE.gpu_model}`,
        `  vram_gb: ${IDLE_NODE.vram_gb}`,
        '  precision: bf16',
        '  gradient_checkpointing: true',
      ];
    }
    if (file === 'requirements.txt') {
      return [
        'torch==2.1.0',
        'transformers==4.35.0',
        'datasets==2.15.0',
        'accelerate==0.24.1',
        'bitsandbytes==0.41.3',
        'peft==0.6.2',
        'tqdm==4.66.1',
      ];
    }
    if (file === 'README.md') {
      return [
        '# LLaMA-3 Fine-tuning on GreenMesh',
        '',
        'Run `python train.py` to start fine-tuning.',
        'Checkpoints saved every 600 steps to /workspace/checkpoints',
        'Logs streamed to /workspace/logs/train.log',
      ];
    }
    if (!file) return ['cat: missing file operand'];
    return [`cat: ${file}: No such file or directory`];
  },
  'df': () => [
    'Filesystem      Size  Used Avail Use% Mounted on',
    'overlay         100G   12G   88G  12% /',
    'tmpfs            64M     0   64M   0% /dev',
    '/dev/nvme0n1p1  500G   89G  411G  18% /workspace',
    'shm              64M  4.0K   64M   1% /dev/shm',
  ],
  'free': () => [
    '               total        used        free      shared  buff/cache   available',
    `Mem:          ${(IDLE_NODE.vram_gb * 1.5 * 1024).toFixed(0).padStart(11)}      ${(3.2 * 1024).toFixed(0).padStart(11)}      ${(IDLE_NODE.vram_gb * 1.5 * 1024 - 3300).toFixed(0).padStart(11)}         384      1.2G      ${(IDLE_NODE.vram_gb * 1.2 * 1024).toFixed(0).padStart(8)}`,
    'Swap:           8192           0        8192',
  ],
  whoami: () => ['runner'],
  pwd: () => ['/workspace'],
  'uname': () => [`Linux greenmesh-node-${IDLE_NODE.id} 6.5.0-41-generic #41~22.04.2-Ubuntu SMP PREEMPT_DYNAMIC x86_64 x86_64 x86_64 GNU/Linux`],
  env: () => [
    `CUDA_VISIBLE_DEVICES=0`,
    `NVIDIA_DRIVER_VERSION=545.29.06`,
    `GPU_MODEL=${IDLE_NODE.gpu_model}`,
    `VRAM_GB=${IDLE_NODE.vram_gb}`,
    'NODE_ID=' + IDLE_NODE.id,
    'SANDBOX=gvisor-runsc',
    'WORKSPACE=/workspace',
    'HOME=/home/runner',
    'PYTHONPATH=/workspace',
    'GREENMESH_JOB_ID=' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    'GREENMESH_PROVIDER=' + PROVIDER.display_name,
    'GREENMESH_REGION=' + (IDLE_NODE.region ?? 'ap-south'),
  ],
  'curl': (args) => {
    if (args[0] === 'ifconfig.me') return ['10.88.0.' + Math.floor(Math.random() * 254 + 1) + '  # Sandboxed egress IP'];
    return [`curl: (6) Could not resolve host: ${args[0]}`];
  },
  ps: () => [
    '  PID TTY          TIME CMD',
    '    1 ?        00:00:00 sh',
    '   12 ?        00:00:00 bash',
    '   45 ?        00:00:00 ps',
  ],
  top: () => [
    'top - 17:32:01 up 2 days,  5:14,  1 user,  load average: 0.82, 0.79, 0.75',
    'Tasks:   4 total,   1 running,   3 sleeping,   0 stopped,   0 zombie',
    '%Cpu(s):  8.3 us,  2.1 sy,  0.0 ni, 89.2 id,  0.4 wa,  0.0 hi,  0.0 si',
    'MiB Mem :  32768.0 total,  28441.2 free,   3216.1 used,   1110.7 buff/cache',
    '',
    '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
    '   45 runner    20   0   12.1m   3.2m   2.1m R   8.3   0.0   0:00.08 python',
    '    1 runner    20   0    4312    632    576 S   0.0   0.0   0:00.00 sh',
    '   12 runner    20   0    5640   2.1m   1.8m S   0.0   0.0   0:00.02 bash',
  ],
};

// ── Mini Sparkline ─────────────────────────────────────────────────────────

function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const w = 180;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = height - ((v - min) / (max - min + 0.001)) * height;
    return `${x},${y}`;
  }).join(' ');
  const fillPts = `0,${height} ${pts} ${w},${height}`;

  return (
    <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polygon points={fillPts} fill={`${color}18`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Metric Card ────────────────────────────────────────────────────────────

function MetricCard({
  label, value, unit, color, history, icon, max = 100,
}: {
  label: string; value: number; unit: string; color: string;
  history: number[]; icon: string; max?: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="glass-card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{icon} {label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color, fontSize: '1.1rem' }}>{value.toFixed(1)}<span style={{ fontSize: '0.7rem', fontWeight: 400, marginLeft: 2 }}>{unit}</span></span>
      </div>
      <div className="progress-bar" style={{ height: 3, marginBottom: 10 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <Sparkline data={history} color={color} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function VGPUPage() {
  const [tab, setTab] = useState<TabId>('terminal');
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 0, type: 'system', text: `GreenMesh vGPU Terminal v2.0 — Node: ${IDLE_NODE.id}` },
    { id: 1, type: 'system', text: `GPU: ${IDLE_NODE.gpu_model} | ${IDLE_NODE.vram_gb}GB VRAM | Provider: ${PROVIDER.display_name}` },
    { id: 2, type: 'system', text: `Region: ${IDLE_NODE.region ?? 'ap-south'} | Carbon: ${IDLE_NODE.carbon_intensity_gco2_kwh} gCO₂/kWh` },
    { id: 3, type: 'info', text: `Type "help" for available commands. Type "python train.py" to launch a training job.` },
    { id: 4, type: 'output', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [telemetry, setTelemetry] = useState<GPUTelemetry[]>(generateTelemetry(IDLE_NODE.id, 60));
  const [jobs, setJobs] = useState<VJob[]>([]);
  const [logs, setLogs] = useState<string[]>([
    `[17:30:00] [SYS] GreenMesh agent started`,
    `[17:30:01] [SYS] Node ${IDLE_NODE.id} registered — ${IDLE_NODE.gpu_model}`,
    `[17:30:02] [SYS] Waiting for job allocation...`,
  ]);
  const [lineCounter, setLineCounter] = useState(10);
  const [activeNodeIdx, setActiveNodeIdx] = useState(
    MOCK_GPU_NODES.findIndex(n => n.id === IDLE_NODE.id)
  );
  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeNode = MOCK_GPU_NODES[activeNodeIdx] ?? IDLE_NODE;
  const latest = telemetry[telemetry.length - 1];

  // Live telemetry ticker
  useEffect(() => {
    const iv = setInterval(() => {
      setTelemetry(prev => {
        const last = prev[prev.length - 1];
        const isRunning = jobs.some(j => j.status === 'running');
        return [...prev.slice(-119), {
          time: new Date().toISOString(),
          gpu_node_id: activeNode.id,
          temperature_c: Math.max(30, Math.min(95, last.temperature_c + (Math.random() - 0.5) * (isRunning ? 4 : 2))),
          vram_used_gb: Math.max(0, Math.min(activeNode.vram_gb, last.vram_used_gb + (Math.random() - 0.5) * (isRunning ? 3 : 0.5))),
          power_draw_w: Math.max(50, Math.min(450, last.power_draw_w + (Math.random() - 0.5) * (isRunning ? 30 : 10))),
          fan_speed_pct: Math.max(20, Math.min(100, last.fan_speed_pct + (Math.random() - 0.5) * 5)),
          utilization_pct: isRunning
            ? Math.max(60, Math.min(100, last.utilization_pct + (Math.random() - 0.5) * 8))
            : Math.max(0, Math.min(15, last.utilization_pct + (Math.random() - 0.45) * 3)),
        }];
      });
    }, 2000);
    return () => clearInterval(iv);
  }, [activeNode.id, jobs]);

  // Job progress simulation
  useEffect(() => {
    const iv = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.status !== 'running') return job;
        const newProgress = Math.min(100, job.progress + Math.random() * 1.5 + 0.5);
        const newLogs = [...job.logs];

        if (Math.floor(newProgress / 10) > Math.floor(job.progress / 10)) {
          const step = Math.floor(newProgress / 10) * 300;
          const msg = `[${new Date().toLocaleTimeString()}] Step ${step}/3000 | loss: ${(2.4 - newProgress * 0.018).toFixed(4)} | lr: 3.00e-4 | grad_norm: ${(1.2 + Math.random() * 0.3).toFixed(3)}`;
          newLogs.push(msg);
          setLogs(l => [...l, `[${new Date().toLocaleTimeString()}] [JOB:${job.id}] ${msg}`]);
        }

        // Checkpoint every 30% progress
        if (Math.floor(newProgress / 30) > Math.floor(job.progress / 30) && newProgress < 100) {
          const ckptMsg = `Checkpoint saved → /workspace/checkpoints/ckpt-step-${Math.floor(newProgress / 30) * 900}.pt`;
          newLogs.push(`💾 ${ckptMsg}`);
          setLogs(l => [...l, `[${new Date().toLocaleTimeString()}] [JOB:${job.id}] 💾 ${ckptMsg}`]);
        }

        return {
          ...job,
          progress: newProgress,
          status: newProgress >= 100 ? 'completed' : 'running',
          checkpoints: Math.floor(newProgress / 30),
          logs: newLogs.slice(-50),
        };
      }));
    }, 1500);
    return () => clearInterval(iv);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current && tab === 'terminal') {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [lines, tab]);

  const addLines = useCallback((newLines: TerminalLine[]) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  const runCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const id = lineCounter;
    setLineCounter(c => c + 100);

    // Echo the input
    const inputLine: TerminalLine = { id, type: 'input', text: trimmed };

    if (trimmed === 'clear') {
      setLines([{ id: id + 1, type: 'system', text: `GreenMesh vGPU Terminal — ${activeNode.gpu_model}` }]);
      return;
    }

    const parts = trimmed.split(/\s+/);
    const base  = parts[0].toLowerCase();
    const args  = parts.slice(1);

    // Special: nvidia-smi
    if (base === 'nvidia-smi') {
      const nvidiaLines = buildNvidiaSmi(latest).map((t, i) => ({
        id: id + 2 + i, type: 'output' as const, text: t,
      }));
      addLines([inputLine, ...nvidiaLines, { id: id + 200, type: 'output', text: '' }]);
      return;
    }

    // Special: python train.py
    if (base === 'python' && args[0] === 'train.py') {
      const jobId = Math.random().toString(36).slice(2, 8).toUpperCase();
      const newJob: VJob = {
        id: jobId, image: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',
        vram: Math.min(16, activeNode.vram_gb), started: new Date(),
        progress: 0, status: 'running', checkpoints: 0,
        logs: [`[${new Date().toLocaleTimeString()}] Training started — Job ID: ${jobId}`],
      };
      setJobs(prev => [...prev, newJob]);
      setLogs(l => [...l, `[${new Date().toLocaleTimeString()}] [SYS] New job started: ${jobId}`]);

      const startLines: TerminalLine[] = [
        { id: id + 1, type: 'info', text: `🚀 Launching training job: ${jobId}` },
        { id: id + 2, type: 'output', text: `Loading config from /workspace/config.yaml...` },
        { id: id + 3, type: 'output', text: `Initializing ${activeNode.gpu_model} (${activeNode.vram_gb}GB VRAM)...` },
        { id: id + 4, type: 'output', text: `CUDA device: 0 — Compute Capability ${activeNode.tflops ?? 82.6 > 50 ? '8.9' : '8.6'}` },
        { id: id + 5, type: 'output', text: `Loading model: llama-3-8b (32 layers, 4096 hidden)...` },
        { id: id + 6, type: 'output', text: `Loading dataset from /workspace/dataset.pkl...` },
        { id: id + 7, type: 'success', text: `✅ Training started! Switch to the Jobs tab to monitor progress.` },
        { id: id + 8, type: 'info', text: `💡 Checkpoint saved every ~300 steps to /workspace/checkpoints/` },
        { id: id + 9, type: 'output', text: '' },
      ];
      addLines([inputLine, ...startLines]);
      return;
    }

    // Static commands
    const handler = STATIC_COMMANDS[base];
    if (handler) {
      const outputLines = handler(args, latest).map((t, i) => ({
        id: id + 2 + i, type: 'output' as const, text: t,
      }));
      addLines([inputLine, ...outputLines, { id: id + 500, type: 'output', text: '' }]);
      return;
    }

    // Unknown
    addLines([
      inputLine,
      { id: id + 1, type: 'error', text: `bash: ${base}: command not found — type "help" for available commands` },
      { id: id + 2, type: 'output', text: '' },
    ]);
  }, [lineCounter, latest, addLines, activeNode]);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const cmd = input;
      setHistory(h => [cmd, ...h].slice(0, 50));
      setHistIdx(-1);
      setInput('');
      runCommand(cmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? '' : history[idx]);
    }
  }

  const lineColors: Record<TerminalLine['type'], string> = {
    input:   '#00ff88',
    output:  '#c9d8f0',
    error:   '#f87171',
    info:    '#00d4ff',
    success: '#4ade80',
    system:  '#a78bfa',
  };

  const histSlice = useMemo(() => telemetry.slice(-60), [telemetry]);
  const temps   = useMemo(() => histSlice.map(t => t.temperature_c), [histSlice]);
  const utils   = useMemo(() => histSlice.map(t => t.utilization_pct), [histSlice]);
  const powers  = useMemo(() => histSlice.map(t => t.power_draw_w), [histSlice]);
  const vrams   = useMemo(() => histSlice.map(t => t.vram_used_gb), [histSlice]);
  const { color: carbonColor, label: carbonLabel } = getCarbonScore(activeNode.carbon_intensity_gco2_kwh);

  const TABS: { id: TabId; label: string; badge?: string }[] = [
    { id: 'terminal', label: '⌨️ Terminal' },
    { id: 'metrics',  label: '📊 Metrics' },
    { id: 'jobs',     label: '🚀 Jobs', badge: jobs.filter(j => j.status === 'running').length.toString() },
    { id: 'logs',     label: '📄 Logs' },
  ];

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar__logo">
          <div className="navbar__logo-icon">⚡</div>
          <span className="gradient-text">GreenMesh</span>
        </Link>
        <ul className="navbar__links">
          <li><Link href="/marketplace">Marketplace</Link></li>
          <li><Link href="/guidelines">Guidelines</Link></li>
          <li><Link href="/vgpu" style={{ color: 'var(--color-accent-cyan)' }}>vGPU Terminal</Link></li>
        </ul>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard/consumer" className="btn btn-secondary btn-sm">Dashboard</Link>
          <Link href="/login" className="btn btn-primary btn-sm">Log In</Link>
        </div>
      </nav>

      <div style={{ paddingTop: 72, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: 'rgba(0,212,255,0.04)', borderBottom: '1px solid rgba(0,212,255,0.1)', padding: '20px 0' }}>
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: '1.5rem' }}>💻</span>
                  <h1 style={{ fontSize: '1.6rem' }}>Virtual <span className="gradient-text">GPU Terminal</span></h1>
                </div>
                <p style={{ fontSize: '0.85rem' }}>
                  Interactive GPU compute environment — live telemetry, real shell, job simulation
                </p>
              </div>
              {/* Node selector */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Node:</span>
                <select className="select" style={{ width: 220 }}
                  value={activeNodeIdx}
                  onChange={e => {
                    setActiveNodeIdx(+e.target.value);
                    setTelemetry(generateTelemetry(MOCK_GPU_NODES[+e.target.value].id, 60));
                  }}>
                  {MOCK_GPU_NODES.filter(n => n.status !== 'banned').map((n, i) => (
                    <option key={n.id} value={i}>
                      {n.gpu_model} ({n.vram_gb}GB) — {n.status.toUpperCase()}
                    </option>
                  ))}
                </select>
                <span className={`badge badge-${activeNode.status === 'idle' ? 'online' : activeNode.status}`}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                  {activeNode.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="page-container" style={{ paddingTop: 24, paddingBottom: 40, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Top metrics strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Temperature', val: latest?.temperature_c ?? 65, unit: '°C', color: (latest?.temperature_c ?? 65) > 82 ? '#ef4444' : '#f59e0b', icon: '🌡️', max: 100 },
              { label: 'GPU Utilization', val: latest?.utilization_pct ?? 0, unit: '%', color: '#00d4ff', icon: '⚡', max: 100 },
              { label: 'VRAM Used', val: latest?.vram_used_gb ?? 0, unit: `/${activeNode.vram_gb}GB`, color: '#a78bfa', icon: '💾', max: activeNode.vram_gb },
              { label: 'Power Draw', val: latest?.power_draw_w ?? 0, unit: 'W', color: '#fbbf24', icon: '🔋', max: 450 },
              { label: 'Fan Speed', val: latest?.fan_speed_pct ?? 30, unit: '%', color: '#4ade80', icon: '🌀', max: 100 },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.icon} {m.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: m.color }}>
                  {m.val.toFixed(1)}<span style={{ fontSize: '0.7rem', fontWeight: 400 }}>{m.unit}</span>
                </div>
                <div className="progress-bar" style={{ height: 2, marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${Math.min((m.val / m.max) * 100, 100)}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 0, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.88rem', fontWeight: tab === t.id ? 700 : 500,
                  color: tab === t.id ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)',
                  borderBottom: `2px solid ${tab === t.id ? 'var(--color-accent-cyan)' : 'transparent'}`,
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {t.label}
                {t.badge && +t.badge > 0 && (
                  <span style={{ background: '#00ff88', color: '#080b14', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px' }}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Terminal Tab ── */}
          {tab === 'terminal' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid rgba(0,212,255,0.15)', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
              {/* Terminal output */}
              <div
                ref={termRef}
                onClick={() => inputRef.current?.focus()}
                style={{
                  flex: 1, padding: 20, overflowY: 'auto', cursor: 'text',
                  background: 'rgba(0,0,0,0.5)', minHeight: 420, maxHeight: 560,
                  fontFamily: 'var(--font-mono)', fontSize: '0.83rem', lineHeight: 1.7,
                }}>
                {lines.map(line => (
                  <div key={line.id} style={{ color: lineColors[line.type], whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {line.type === 'input'
                      ? <><span style={{ color: '#00ff88' }}>runner@{activeNode.id}:/workspace$ </span><span style={{ color: '#f0f6ff' }}>{line.text}</span></>
                      : line.type === 'system'
                        ? <span style={{ color: '#a78bfa' }}>▶ {line.text}</span>
                        : line.text
                    }
                  </div>
                ))}
              </div>

              {/* Input line */}
              <div style={{
                display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 10,
                background: 'rgba(0,0,0,0.7)', borderTop: '1px solid rgba(0,212,255,0.1)',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#00ff88', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  runner@{activeNode.id}:/workspace$
                </span>
                <input
                  ref={inputRef}
                  autoFocus
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    fontFamily: 'var(--font-mono)', fontSize: '0.83rem',
                    color: '#f0f6ff', caretColor: '#00ff88',
                  }}
                  placeholder="Type a command..."
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  onClick={() => { runCommand(input); setInput(''); }}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  ↵ Run
                </button>
              </div>

              {/* Quick commands */}
              <div style={{ padding: '10px 20px', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['nvidia-smi', 'python train.py', 'ls', 'cat config.yaml', 'df -h', 'env', 'help'].map(cmd => (
                  <button key={cmd} onClick={() => { setInput(cmd); inputRef.current?.focus(); }}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '3px 10px',
                      background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                      color: '#00d4ff', borderRadius: 6, cursor: 'pointer',
                    }}>
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Metrics Tab ── */}
          {tab === 'metrics' && (
            <div style={{ padding: '24px 0', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <MetricCard label="Temperature" value={latest?.temperature_c ?? 65} unit="°C"
                  color={(latest?.temperature_c ?? 65) > 82 ? '#ef4444' : '#f59e0b'}
                  history={temps} icon="🌡️" max={100} />
                <MetricCard label="GPU Utilization" value={latest?.utilization_pct ?? 0} unit="%"
                  color="#00d4ff" history={utils} icon="⚡" max={100} />
                <MetricCard label="Power Draw" value={latest?.power_draw_w ?? 0} unit="W"
                  color="#fbbf24" history={powers} icon="🔋" max={450} />
                <MetricCard label="VRAM Used" value={latest?.vram_used_gb ?? 0} unit="GB"
                  color="#a78bfa" history={vrams} icon="💾" max={activeNode.vram_gb} />
              </div>

              {/* Node info */}
              <div className="glass-card" style={{ padding: 20 }}>
                <h4 style={{ marginBottom: 16 }}>Node Specifications</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {[
                    { label: 'GPU Model', value: activeNode.gpu_model },
                    { label: 'VRAM Total', value: `${activeNode.vram_gb}GB` },
                    { label: 'CUDA Cores', value: activeNode.cuda_cores?.toLocaleString() ?? 'N/A' },
                    { label: 'TFLOPS (FP32)', value: `${activeNode.tflops ?? '—'} TFLOPS` },
                    { label: 'Driver Version', value: activeNode.driver_version },
                    { label: 'Benchmark Score', value: `${activeNode.benchmark_score}/100` },
                    { label: 'Carbon Intensity', value: `${activeNode.carbon_intensity_gco2_kwh} gCO₂/kWh` },
                    { label: 'Carbon Label', value: carbonLabel },
                    { label: 'Latency', value: `${activeNode.latency_ms ?? '—'} ms` },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.label === 'Carbon Label' ? carbonColor : 'var(--color-text-primary)' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Jobs Tab ── */}
          {tab === 'jobs' && (
            <div style={{ padding: '24px 0', flex: 1 }}>
              {jobs.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>🖥️</div>
                  <h3>No jobs yet</h3>
                  <p>Go to the Terminal tab and run <code style={{ fontFamily: 'var(--font-mono)', color: '#00ff88' }}>python train.py</code> to start a job.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[...jobs].reverse().map(job => (
                    <div key={job.id} className="glass-card" style={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#{job.id}</span>
                            <span className={`badge badge-${job.status}`}>{job.status.toUpperCase()}</span>
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{job.image}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                            Started: {job.started.toLocaleTimeString()} · VRAM: {job.vram}GB · Checkpoints: {job.checkpoints}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.8rem', color: job.status === 'completed' ? '#00ff88' : '#00d4ff' }}>
                            {job.progress.toFixed(1)}%
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>progress</div>
                        </div>
                      </div>
                      <div className="progress-bar" style={{ height: 8, marginBottom: 16 }}>
                        <div className="progress-fill" style={{ width: `${job.progress}%`, background: job.status === 'completed' ? '#00ff88' : undefined }} />
                      </div>
                      <div style={{ maxHeight: 140, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#8b9ab8', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12 }}>
                        {job.logs.slice(-8).map((l, i) => (
                          <div key={i} style={{ color: l.startsWith('💾') ? '#00ff88' : undefined }}>{l}</div>
                        ))}
                        {job.status === 'running' && <span style={{ color: '#00d4ff' }}>▮</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Logs Tab ── */}
          {tab === 'logs' && (
            <div style={{
              flex: 1, padding: 20, fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)',
              borderTop: 'none', borderRadius: '0 0 12px 12px', overflowY: 'auto',
              maxHeight: 560, lineHeight: 1.8,
            }}>
              {logs.map((line, i) => {
                const isCheckpoint = line.includes('💾');
                const isSys = line.includes('[SYS]');
                const isError = line.toLowerCase().includes('error');
                const color = isCheckpoint ? '#00ff88' : isError ? '#f87171' : isSys ? '#a78bfa' : '#8b9ab8';
                return (
                  <div key={i} style={{ color, borderBottom: isCheckpoint ? '1px solid rgba(0,255,136,0.1)' : 'none', padding: isCheckpoint ? '2px 0' : '0' }}>
                    {line}
                  </div>
                );
              })}
              <span style={{ color: '#00d4ff' }}>▮</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
