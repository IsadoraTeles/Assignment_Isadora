import { useEffect, useState } from "react";
import rawData from "@/data/seqera-sample-data.json";
import type { Run, RunsData } from "./types";

/** Simulated network latency so the loading state exercises a real code path. */
const SIMULATED_LATENCY_MS = 600;

export type RunsState =
  | { status: "loading"; runs: null; error: null }
  | { status: "success"; runs: Run[]; error: null }
  | { status: "error"; runs: null; error: string };

/**
 * Data layer for the dashboard. Statically imports the bundled JSON (kept out of
 * the render path) and resolves it after a simulated delay so loading skeletons
 * aren't faked. Typed to Run[] — the JSON is asserted to the derived shape here,
 * the one boundary where we cross from `unknown-ish JSON` into typed data.
 */
export function useRuns(): RunsState {
  const [state, setState] = useState<RunsState>({
    status: "loading",
    runs: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;
      try {
        const data = rawData as RunsData;
        setState({ status: "success", runs: data.runs, error: null });
      } catch {
        setState({
          status: "error",
          runs: null,
          error: "Could not load pipeline runs.",
        });
      }
    }, SIMULATED_LATENCY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return state;
}
