/**
 * Derives an ordered pipeline "spine" of high-level PHASES from a run's tasks, so a
 * run detail can SHOW where execution reached — all green on a success, red at the
 * phase that broke on a failure — instead of describing it.
 *
 * Grounding: a Nextflow process name is a colon path
 * `NFCORE_VIRALRECON:ILLUMINA:ASSEMBLY_UNICYCLER:UNICYCLER`. The first two segments
 * are the pipeline + entry-workflow wrappers; the next is the enclosing sub-workflow
 * (e.g. ASSEMBLY_UNICYCLER). Grouping by sub-workflow alone yields ~11 nodes that
 * overflow the sheet, so we roll those sub-workflows up into a handful of phases
 * (Prepare / Read QC / Classify / Alignment / Assembly / Variants / Consensus /
 * Report) via keyword rules. Still fully data-driven: which phases appear, their
 * order, and their status all come from the real tasks — nothing is hard-coded to a
 * specific run, and unknown sub-workflows fall back to their own humanised node.
 */
import type { Task } from "./types";

export type PhaseStatus = "done" | "failed" | "not-reached";

export interface Phase {
  /** Phase key (also its display label). */
  key: string;
  /** Phase label for display. */
  label: string;
  status: PhaseStatus;
  taskCount: number;
}

/** Sub-workflow segment after the pipeline + entry-workflow wrappers. */
function subworkflowKey(process: string): string {
  const segments = process.split(":");
  const scoped = segments.length > 2 ? segments.slice(2) : segments;
  return scoped[0];
}

/**
 * Coarse phase taxonomy. Matched against the SUB-WORKFLOW key (not the full path)
 * so a keyword inside a leaf process — e.g. the Kraken DB untarred during genome
 * prep — can't misfile a phase. Order matters: specific/earlier wins (ALIGN before
 * any FASTQ-ish read step). Keywords follow nf-core module naming conventions.
 */
const PHASE_RULES: { match: RegExp; phase: string }[] = [
  { match: /ASSEMBL|SPADES|UNICYCLER|MINIA|MEGAHIT/, phase: "Assembly" },
  { match: /CONSENSUS/, phase: "Consensus" },
  { match: /VARIANT|IVAR|BCFTOOLS|LOFREQ|MEDAKA|SNP\b/, phase: "Variants" },
  {
    match: /ALIGN|BOWTIE|BWA|MINIMAP|STAR|SALMON|SAMTOOLS/,
    phase: "Alignment",
  },
  {
    match: /KRAKEN|KAIJU|CENTRIFUGE|CLASSIF|TAXON|METAPHLAN/,
    phase: "Classify",
  },
  {
    match:
      /FASTP|FASTQC|CUTADAPT|TRIM|CAT_FASTQ|SEQKIT|NANOPLOT|NANOQ|BBSPLIT|BBMAP|SORTMERNA|QCAT/,
    phase: "Read QC",
  },
  {
    match:
      /PREPARE|GENOME|INPUT|SAMPLESHEET|UNTAR|GUNZIP|BUILD|GTF|GFF|FASTA|CHROM|\bBED|HISAT|SPLICE/,
    phase: "Prepare",
  },
  { match: /MULTIQC|REPORT|SUMMARY|DUMPSOFTWARE/, phase: "Report" },
];

/** Map a task's process to its high-level phase (falls back to a humanised node). */
function phaseFor(process: string): string {
  const key = subworkflowKey(process).toUpperCase();
  for (const rule of PHASE_RULES) if (rule.match.test(key)) return rule.phase;
  return humanise(subworkflowKey(process));
}

/** "ASSEMBLY_UNICYCLER" → "Assembly unicycler"; collapses repeats ("KRAKEN2_KRAKEN2" → "Kraken2"). */
function humanise(key: string): string {
  const words: string[] = [];
  for (const raw of key.split("_")) {
    const word = raw.toLowerCase();
    if (words[words.length - 1] !== word) words.push(word);
  }
  const joined = words.join(" ");
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

/** Per-process outcome within a phase — did this process ever complete, ever fail? */
interface ProcessOutcome {
  completed: boolean;
  failed: boolean;
}

/**
 * Resolve a phase's status from its processes' outcomes:
 *  - failed  → a process FAILED and never COMPLETED (terminal — this is where it broke)
 *  - done    → at least one process completed
 *  - not-reached → only ABORTED, nothing finished (started but cut short)
 *
 * Crucially, a process that FAILED on one attempt but COMPLETED on retry is
 * RECOVERED, not a failure — so a SUCCEEDED run (whose failed tasks all recovered)
 * reads all-green, while a genuinely terminal failure (no successful attempt) is red.
 */
function phaseStatus(processes: Map<string, ProcessOutcome>): PhaseStatus {
  const outcomes = [...processes.values()];
  if (outcomes.some((p) => p.failed && !p.completed)) return "failed";
  if (outcomes.some((p) => p.completed)) return "done";
  return "not-reached";
}

/**
 * Build the ordered phase list, ordered by the earliest task start within each
 * phase (execution order). Returns [] for runs with no tasks — callers must render
 * an honest "nothing ran" state rather than a fabricated spine.
 */
export function derivePhases(tasks: Task[] | undefined): Phase[] {
  if (!tasks || tasks.length === 0) return [];

  const groups = new Map<
    string,
    {
      key: string;
      earliest: string;
      processes: Map<string, ProcessOutcome>;
      n: number;
    }
  >();

  for (const task of tasks) {
    const phase = phaseFor(task.process);
    let group = groups.get(phase);
    if (!group) {
      group = { key: phase, earliest: task.start, processes: new Map(), n: 0 };
      groups.set(phase, group);
    }
    // Track outcomes per process so a failed-then-retried task can be seen to recover.
    const outcome = group.processes.get(task.process) ?? {
      completed: false,
      failed: false,
    };
    if (task.status === "COMPLETED") outcome.completed = true;
    else if (task.status === "FAILED") outcome.failed = true;
    group.processes.set(task.process, outcome);
    group.n += 1;
    // Track the earliest start so phases order by when they actually began.
    if (task.start && task.start < group.earliest) group.earliest = task.start;
  }

  return [...groups.values()]
    .sort((a, b) => (a.earliest < b.earliest ? -1 : 1))
    .map((group) => ({
      key: group.key,
      label: group.key,
      status: phaseStatus(group.processes),
      taskCount: group.n,
    }));
}
