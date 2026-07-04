/**
 * Maps a run's projectName to a one-line, plain-language description so a reader
 * scanning the list understands the run without knowing nf-core internals.
 *
 * Copy is taken verbatim from the CLAUDE.md contract (§THE DATA) — it is the
 * agreed wording for these four pipelines, deliberately expert-level (not dumbed
 * down). Keyed by the real projectName values in the data; unknown projects fall
 * back to a generic (but honest) line rather than a fabricated specific claim.
 */
const DESCRIPTIONS: Record<string, string> = {
  "nf-core/rnaseq": "Measures gene expression from RNA sequencing reads.",
  "nf-core/viralrecon": "Reconstructs viral genomes and calls variants.",
  "nf-core/nanoseq": "Analyses Oxford Nanopore long-read sequencing.",
  "nextflow-io/rnaseq-nf": "A minimal RNA-seq demonstration pipeline.",
};

export function describePipeline(projectName: string): string {
  if (DESCRIPTIONS[projectName]) return DESCRIPTIONS[projectName];
  // Generic fallback keyed off the short name, never a made-up specific claim.
  const short = projectName.split("/").pop() ?? projectName;
  return `Nextflow pipeline "${short}".`;
}
