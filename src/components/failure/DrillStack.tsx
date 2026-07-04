/**
 * DrillStack — the progressive-disclosure spine of the failure view: one idea per
 * view, drill in through a door, always a way Back. It owns the view stack, the
 * push/pop motion (depth, not decoration), and focus management: focus follows
 * navigation into each view and back to the previous one.
 *
 * Radix Dialog (the host) provides the focus-trap and Escape; this only moves focus
 * *within* the panel as the user drills, so keyboard users never lose their place.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export interface DrillViewDef {
  id: string;
  title: string;
  render: () => ReactNode;
}

interface DrillContextValue {
  push: (id: string) => void;
  back: () => void;
}

const DrillContext = createContext<DrillContextValue | null>(null);

/** Navigate the drill stack from within a view (doors push, Back pops). */
export function useDrill(): DrillContextValue {
  const ctx = useContext(DrillContext);
  if (!ctx) throw new Error("useDrill must be used inside a <DrillStack>");
  return ctx;
}

interface DrillStackProps {
  views: DrillViewDef[];
  rootId: string;
}

export function DrillStack({ views, rootId }: DrillStackProps) {
  const reduceMotion = useReducedMotion();
  const [stack, setStack] = useState<string[]>([rootId]);
  // +1 push (enter from right), -1 pop (enter from left) — drives slide direction.
  const [direction, setDirection] = useState<1 | -1>(1);

  const push = useCallback((id: string) => {
    setDirection(1);
    setStack((s) => [...s, id]);
  }, []);

  const back = useCallback(() => {
    setDirection(-1);
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  const currentId = stack[stack.length - 1];
  const current = views.find((v) => v.id === currentId) ?? views[0];
  const canGoBack = stack.length > 1;

  const slide = reduceMotion ? 0 : 32;
  const variants = {
    enter: (dir: 1 | -1) => ({ x: dir * slide, opacity: reduceMotion ? 1 : 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 1 | -1) => ({ x: dir * -slide, opacity: reduceMotion ? 1 : 0 }),
  };

  return (
    <DrillContext.Provider value={{ push, back }}>
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
          {canGoBack && (
            <button
              type="button"
              onClick={back}
              className="-ml-2 inline-flex items-center gap-1 rounded-sm px-2 py-1 text-sm font-semibold text-primary-text hover:bg-surface-sunk"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
          )}
          <h2 className="text-sm font-semibold text-ink">{current.title}</h2>
        </header>

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.section
              key={current.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: reduceMotion ? 0 : 0.24,
                ease: "easeOut",
              }}
              className="absolute inset-0 overflow-y-auto"
            >
              <FocusRegion label={current.title}>
                {current.render()}
              </FocusRegion>
            </motion.section>
          </AnimatePresence>
        </div>
      </div>
    </DrillContext.Provider>
  );
}

/**
 * Wraps each view's body and takes focus when it mounts — i.e. every time the user
 * pushes into a view or pops back, focus lands on the fresh view (which is re-keyed
 * per navigation), so the keyboard path follows the visual one.
 */
function FocusRegion({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} tabIndex={-1} aria-label={label} className="p-6">
      {children}
    </div>
  );
}
