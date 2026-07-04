/**
 * FailureView — assembles the failed-run drill-stack: a summary root plus the three
 * doors (What ran, Raw platform error, Complete results). The DrillStack handles
 * navigation, motion, and focus; this just declares the views for one run.
 */
import type { Run } from "@/lib/types";
import { DrillStack, type DrillViewDef } from "./DrillStack";
import { FailureSummary } from "./FailureSummary";
import { WhatRanView } from "./WhatRanView";
import { RawErrorView } from "./RawErrorView";
import { RunReport } from "./RunReport";

interface FailureViewProps {
  run: Run;
}

export function FailureView({ run }: FailureViewProps) {
  const views: DrillViewDef[] = [
    {
      id: "summary",
      title: "Run detail",
      render: () => <FailureSummary run={run} />,
    },
    {
      id: "what-ran",
      title: "What ran",
      render: () => <WhatRanView run={run} />,
    },
    {
      id: "raw-error",
      title: "Raw platform error",
      render: () => <RawErrorView run={run} />,
    },
    {
      id: "complete-results",
      title: "Complete results — everything on one page",
      render: () => <RunReport run={run} />,
    },
  ];

  return <DrillStack views={views} rootId="summary" />;
}
