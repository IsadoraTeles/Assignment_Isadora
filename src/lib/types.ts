/**
 * Types derived from the ACTUAL shape of src/data/seqera-sample-data.json
 * (profiled field-by-field across all 7 runs / 226 tasks), NOT from the brief.
 *
 * Notes grounded in the real data:
 *  - `tasks` and `metrics` are ABSENT (not just empty) on the CANCELLED run and the
 *    "died on arrival" FAILED run — hence optional here.
 *  - Many fields are genuinely null: duration, start, exitStatus, load.cost,
 *    computeTimeFmt, executors, and most per-task resource metrics.
 *  - RUNNING / SUBMITTED never appear in the data but are kept in the union so the
 *    type is honest about the domain. The UI must not fabricate live progress.
 */

export type RunStatus =
  "SUCCEEDED" | "FAILED" | "CANCELLED" | "RUNNING" | "SUBMITTED";

/** Per-task status seen in the data: COMPLETED | FAILED | ABORTED (kept open-ended). */
export type TaskStatus = "COMPLETED" | "FAILED" | "ABORTED" | (string & {});

export interface RunStats {
  succeedCount: number;
  succeedPct: number;
  succeedDuration: number;
  failedCount: number;
  failedPct: number | null;
  failedDuration: number;
  cachedCount: number;
  cachedPct: number;
  cachedDuration: number;
  ignoredCount: number;
  ignoredPct: number;
  computeTimeFmt: string | null;
}

export interface RunLoad {
  cpus: number;
  cpuTime: number;
  cpuLoad: number;
  cpuEfficiency: number;
  memoryReq: number;
  memoryRss: number;
  memoryEfficiency: number;
  readBytes: number;
  writeBytes: number;
  cost: number | null;
  peakCpus: number;
  peakTasks: number;
  peakMemory: number;
  loadCpus: number;
  loadMemory: number;
  loadTasks: number;
  pending: number;
  submitted: number;
  running: number;
  succeeded: number;
  failed: number;
  cached: number;
  aborted: number;
  retries: number;
  executors: string[] | null;
}

export interface NextflowInfo {
  version: string;
  build: string;
  timestamp: string;
}

export interface Manifest {
  name: string | null;
  description: string;
  author: string | null;
  version: string | null;
  defaultBranch: string | null;
  homePage: string | null;
  mainScript: string;
  nextflowVersion: string;
}

export interface Task {
  taskId: number;
  id: number;
  name: string;
  process: string;
  tag: string | null;
  hash: string;
  status: TaskStatus;
  attempt: number;
  submit: string;
  start: string;
  complete: string | null;
  duration: number | null;
  realtime: number | null;
  cpus: number;
  memory: number;
  disk: number | null;
  time: number;
  pcpu: number | null;
  pmem: number | null;
  rss: number | null;
  peakRss: number | null;
  vmem: number | null;
  peakVmem: number | null;
  readBytes: number | null;
  writeBytes: number | null;
  rchar: number | null;
  wchar: number | null;
  syscr: number | null;
  syscw: number | null;
  volCtxt: number | null;
  invCtxt: number | null;
  exit: number;
  exitStatus: number;
  errorMessage: string | null;
  errorAction: string | null;
  executor: string;
  machineType: string | null;
  cloudZone: string | null;
  priceModel: string | null;
  cost: number | null;
  container: string | null;
  queue: string | null;
  workdir: string;
  script: string;
  nativeId: string;
  dateCreated: string;
  lastUpdated: string;
}

export interface Run {
  id: string;
  runName: string;
  projectName: string;
  repository: string | null;
  revision: string;
  commitId: string | null;
  sessionId: string;
  commandLine: string;
  status: RunStatus;
  userName: string;
  submit: string;
  start: string | null;
  complete: string | null;
  duration: number | null;
  success: boolean | null;
  exitStatus: number | null;
  errorMessage: string | null;
  resume: boolean;
  container: string | null;
  containerEngine: string | null;
  workDir: string;
  launchDir: string | null;
  profile: string;
  nextflow: NextflowInfo;
  manifest: Manifest;
  stats: RunStats;
  load: RunLoad;
  /** Absent on some runs (CANCELLED, died-on-arrival FAILED). */
  tasks?: Task[];
  /** Absent on some runs; contents not modelled at rung 0. */
  metrics?: unknown[];
}

export interface RunsData {
  runs: Run[];
}
