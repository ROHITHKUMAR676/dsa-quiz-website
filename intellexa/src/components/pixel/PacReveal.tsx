import type { ReactElement, ReactNode } from "react";

// 9x9 Pac-Man frames: 1 = body, 0 = empty
const CLOSED = ["..xxxxx..", ".xxxxxxx.", "xxxxxxxxx", "xxxxxxxxx", "xxxxxxxxx", "xxxxxxxxx", "xxxxxxxxx", ".xxxxxxx.", "..xxxxx.."];
const OPEN = ["..xxxxx..", ".xxxxxxx.", "xxxxxxx..", "xxxxxx...", "xxxx.....", "xxxxxx...", "xxxxxxx..", ".xxxxxxx.", "..xxxxx.."];
const GOLD = "#F5B93A";
const OUTLINE = "#161925";

function frame(rows: string[], className: string) {
  const rects: ReactElement[] = [];
  rows.forEach((row, y) =>
    row.split("").forEach((c, x) => {
      if (c === "x") rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={GOLD} />);
    })
  );
  // single pixel eye
  rects.push(<rect key="eye" x={4} y={1} width={1} height={1} fill={OUTLINE} />);
  return (
    <svg
      viewBox="0 0 9 9"
      width={45}
      height={45}
      shapeRendering="crispEdges"
      className={`absolute inset-0 ${className}`}
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}

/**
 * Reveals its children with a Pac-Man that eats a row of dots left to right.
 * Starts when `play` becomes true. The animation itself is plain CSS (see index.css).
 */
export default function PacReveal({ play, children }: { play: boolean; children: ReactNode }) {
  return (
    <div className={`relative ${play ? "pac-play" : ""}`}>
      <div className="pac-clip">{children}</div>
      {play && (
        <>
          <div className="pac-dots" aria-hidden="true" />
          <div className="pac-mover" aria-hidden="true">
            {frame(CLOSED, "pac-closed")}
            {frame(OPEN, "pac-open")}
          </div>
        </>
      )}
    </div>
  );
}
