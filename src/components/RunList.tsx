import { motion, useReducedMotion, type Variants } from "framer-motion";
import { RunCard } from "./RunCard";
import type { Run } from "@/lib/types";

interface RunListProps {
  runs: Run[];
  onOpenRun: (run: Run) => void;
}

/**
 * The runs overview list. Items fade/slide in with a small stagger on load.
 * Under prefers-reduced-motion the variants collapse to no transform/opacity change.
 */
export function RunList({ runs, onOpenRun }: RunListProps) {
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: reduceMotion ? {} : { staggerChildren: 0.05 },
    },
  };

  const item: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.25, ease: "easeOut" },
        },
      };

  return (
    <motion.ul
      variants={container}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3"
      aria-label="Pipeline runs"
    >
      {runs.map((run) => (
        <motion.li key={run.id} variants={item}>
          <RunCard run={run} onOpen={onOpenRun} />
        </motion.li>
      ))}
    </motion.ul>
  );
}
