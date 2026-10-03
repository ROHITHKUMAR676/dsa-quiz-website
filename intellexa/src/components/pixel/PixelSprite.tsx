import type { ReactElement } from "react";
import { cn } from "../../lib/utils";

export type PixelKind = "stack" | "queue" | "tree" | "list" | "array" | "graph";

// Tiny pixel-art DSA sprites. 1=blue, 2=cyan, 3=purple, x=muted, .=empty
const SPRITES: Record<PixelKind, string[]> = {
  "stack": [
    "................",
    ".1............1.",
    ".1..22222222..1.",
    ".1..22222222..1.",
    ".1............1.",
    ".1..33333333..1.",
    ".1..33333333..1.",
    ".1............1.",
    ".1..33333333..1.",
    ".1..33333333..1.",
    ".1............1.",
    ".1..33333333..1.",
    ".1..33333333..1.",
    ".11111111111111."
  ],
  "queue": [
    ".11111111111111.",
    "................",
    "..222.333.333...",
    "..222.333.333...",
    "..222.333.333...",
    "..222.333.333...",
    "................",
    ".11111111111111."
  ],
  "tree": [
    "......222.......",
    "......222.......",
    "......222.......",
    ".......x........",
    "...xxxxxxxxx....",
    "..333.....333...",
    "..333.....333...",
    "..333.....333...",
    "...x.......x....",
    ".xxxxx...xxxxx..",
    "111.111.111.111.",
    "111.111.111.111.",
    "111.111.111.111."
  ],
  "list": [
    "22222...33333...33333...",
    "22222..x33333..x33333.x.",
    "22322xxx33233xxx33233xx.",
    "22222..x33333..x33333.x.",
    "22222...33333...33333..."
  ],
  "array": [
    "333.222.333.333",
    "333.222.333.333",
    "333.222.333.333",
    "...............",
    ".x...x...x...x."
  ],
  "graph": [
    "333..........333",
    "333..........333",
    "333..........333",
    ".x.x........x.x.",
    ".x..x......x..x.",
    ".x...x222.x...x.",
    ".x....222.....x.",
    ".x...x222.x...x.",
    ".x..x......x..x.",
    ".x.x........x.x.",
    "333..........333",
    "333..........333",
    "333..........333"
  ]
};

const PALETTE: Record<string, string> = {
  "1": "rgb(var(--color-neon-blue))",
  "2": "rgb(var(--color-neon-cyan))",
  "3": "rgb(var(--color-neon-purple))",
  x: "rgb(var(--color-ink-faint))",
};

export const PIXEL_KINDS = Object.keys(SPRITES) as PixelKind[];

interface PixelSpriteProps {
  kind: PixelKind;
  size?: number;
  bob?: boolean;
  className?: string;
}

export default function PixelSprite({ kind, size = 3, bob = false, className }: PixelSpriteProps) {
  const rows = SPRITES[kind];
  const h = rows.length;
  const w = rows[0].length;
  const rects: ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      const c = row[x];
      if (c === ".") { x++; continue; }
      let run = 1;
      while (x + run < w && row[x + run] === c) run++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={PALETTE[c]} />);
      x += run;
    }
  });
  return (
    <svg
      width={w * size}
      height={h * size}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={cn("shrink-0", bob && "animate-pixel-bob", className)}
    >
      {rects}
    </svg>
  );
}
