import PixelSprite, { type PixelKind } from "./PixelSprite";

// Data structures drifting through space. `top` is a viewport %, `dur` the seconds
// for one pass across the screen, `delay` a negative offset so they start mid-flight.
const DRIFTERS: { kind: PixelKind; top: number; size: number; dur: number; delay: number; mobile?: boolean }[] = [
  { kind: "tree", top: 8, size: 4, dur: 170, delay: -20 },
  { kind: "list", top: 24, size: 3, dur: 140, delay: -90, mobile: true },
  { kind: "graph", top: 42, size: 4, dur: 190, delay: -150 },
  { kind: "stack", top: 60, size: 4, dur: 160, delay: -60, mobile: true },
  { kind: "heap", top: 74, size: 3, dur: 150, delay: -110 },
  { kind: "queue", top: 88, size: 3, dur: 130, delay: -30 },
  { kind: "hash", top: 15, size: 3, dur: 200, delay: -170 },
  { kind: "array", top: 52, size: 3, dur: 120, delay: -10, mobile: true },
  { kind: "crystal", top: 34, size: 5, dur: 180, delay: -70 },
  { kind: "moon", top: 68, size: 5, dur: 210, delay: -130, mobile: true },
];

/** Fixed, non-interactive space scene: pixel stars (see index.css) plus drifting DSA sprites and a ship. */
export default function SpaceBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden opacity-[0.35]">
      {DRIFTERS.map((d) => (
        <div
          key={d.kind}
          className={`absolute left-0 ${d.mobile ? "" : "hidden md:block"}`}
          style={{
            top: `${d.top}%`,
            animation: `drift-x ${d.dur}s linear infinite`,
            animationDelay: `${d.delay}s`,
          }}
        >
          <PixelSprite kind={d.kind} size={d.size} />
        </div>
      ))}
      {/* the ship, flying a slow diagonal */}
      <div className="absolute left-[12%] top-[30%]" style={{ animation: "ship-fly 60s linear infinite" }}>
        <div style={{ transform: "rotate(45deg)" }}>
          <PixelSprite kind="rocket" size={4} />
        </div>
      </div>
    </div>
  );
}
