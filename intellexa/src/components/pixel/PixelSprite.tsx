import type { ReactElement } from "react";
import { cn } from "../../lib/utils";

export type PixelKind =
  | "stack" | "queue" | "tree" | "list" | "array" | "graph" | "heap" | "hash"
  | "rocket" | "moon" | "crystal";

// Tiny pixel-art space sprites, every one of them a data structure.
// 1 = bright, 2 = soft, 3 = dim, x = faint, .=empty. Colours follow the theme ink.
type Grid = string[][];
const blank = (w: number, h: number): Grid => Array.from({ length: h }, () => Array(w).fill("."));
const line = (g: Grid, x0: number, y0: number, x1: number, y1: number, c = "x") => {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    if (g[y0]?.[x0] === ".") g[y0][x0] = c;
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
};
// round planet-node, 5x5 ring (filled = solid dot inside)
const node = (g: Grid, cx: number, cy: number, filled = false) => {
  const ring = [[-1,-2],[0,-2],[1,-2],[-2,-1],[2,-1],[-2,0],[2,0],[-2,1],[2,1],[-1,2],[0,2],[1,2]];
  ring.forEach(([x, y]) => (g[cy + y][cx + x] = "1"));
  g[cy][cx] = filled ? "1" : "3";
  if (filled) [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]].forEach(([x, y]) => (g[cy + y][cx + x] = "1"));
};
const box = (g: Grid, x: number, y: number, w: number, h: number, c = "1", fill = ".") => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const edge = i === 0 || j === 0 || i === w - 1 || j === h - 1;
    g[y + j][x + i] = edge ? c : fill;
  }
};
const out = (g: Grid) => g.map((r) => r.join(""));

// binary tree constellation
const treeG = (() => {
  const g = blank(27, 21);
  line(g, 13, 3, 6, 10); line(g, 13, 3, 20, 10);
  line(g, 6, 10, 3, 17); line(g, 6, 10, 9, 17);
  line(g, 20, 10, 17, 17); line(g, 20, 10, 23, 17);
  node(g, 13, 3, true); node(g, 6, 10); node(g, 20, 10);
  [3, 9, 17, 23].forEach((x) => node(g, x, 17, x === 9));
  return out(g);
})();
// min-heap: filled planets
const heapG = (() => {
  const g = blank(21, 16);
  line(g, 10, 3, 5, 10); line(g, 10, 3, 15, 10);
  line(g, 5, 10, 2, 13); line(g, 15, 10, 18, 13);
  node(g, 10, 3, true); node(g, 5, 10, true); node(g, 15, 10, true);
  return out(g.slice(0, 13).map((r) => r));
})();
// graph: five nodes, weighted-looking edges
const graphG = (() => {
  const g = blank(27, 21);
  line(g, 4, 4, 22, 4); line(g, 4, 4, 13, 11); line(g, 22, 4, 13, 11);
  line(g, 13, 11, 5, 17); line(g, 13, 11, 21, 17); line(g, 5, 17, 21, 17);
  node(g, 4, 4); node(g, 22, 4, true); node(g, 13, 11, true); node(g, 5, 17); node(g, 21, 17);
  return out(g);
})();
// singly linked list: boxes joined by arrows
const listG = (() => {
  const g = blank(40, 9);
  [0, 14, 28].forEach((x, i) => {
    box(g, x, 1, 11, 7, "1");
    for (let j = 2; j <= 6; j++) g[j][x + 7] = "1";
    g[4][x + 3] = "2"; g[4][x + 4] = "2";
    if (i < 2) { line(g, x + 9, 4, x + 14, 4, "2"); }
  });
  g[4][40 - 1] = ".";
  return out(g).map((r) => r.slice(0, 40));
})();
// array: indexed cells
const arrayG = (() => {
  const g = blank(32, 9);
  for (let i = 0; i < 4; i++) {
    box(g, i * 8, 0, 8, 6, "1");
    g[2][i * 8 + 3] = "2"; g[2][i * 8 + 4] = "2"; g[3][i * 8 + 3] = "2"; g[3][i * 8 + 4] = "2";
    g[8][i * 8 + 3] = "x"; g[8][i * 8 + 4] = "x";
  }
  return out(g);
})();
// stack: crates dropped into a U-shaped bay, an arrow on top
const stackG = (() => {
  const g = blank(18, 22);
  line(g, 8, 0, 8, 2, "1"); line(g, 6, 2, 8, 4, "1"); line(g, 10, 2, 8, 4, "1");
  for (let i = 0; i < 3; i++) box(g, 3, 6 + i * 5, 12, 5, i === 0 ? "1" : "2");
  for (let j = 5; j < 21; j++) { g[j][0] = "1"; g[j][17] = "1"; }
  for (let i = 0; i < 18; i++) g[21][i] = "1";
  return out(g);
})();
// queue: a lane of crates, enqueue and dequeue marks
const queueG = (() => {
  const g = blank(40, 12);
  for (let i = 0; i < 4; i++) box(g, 2 + i * 9, 3, 8, 6, i === 0 ? "1" : "2");
  for (let i = 0; i < 40; i++) { g[1][i] = "x"; g[11][i] = "x"; }
  line(g, 0, 6, 1, 6, "1");
  return out(g);
})();
// hash table: buckets with chained entries
const hashG = (() => {
  const g = blank(26, 20);
  for (let i = 0; i < 4; i++) {
    box(g, 0, i * 5, 7, 5, "1");
    g[i * 5 + 2][3] = "2";
    if (i % 2 === 0) { line(g, 7, i * 5 + 2, 11, i * 5 + 2, "x"); box(g, 11, i * 5, 6, 5, "2"); }
    if (i === 0) { line(g, 17, 2, 19, 2, "x"); box(g, 19, 0, 6, 5, "2"); }
  }
  return out(g);
})();
// the ship from the reference art, pointing up
const rocketG = [
  "......1......",
  ".....111.....",
  "....11211....",
  "....12221....",
  "....11211....",
  "....12221....",
  "...1122211...",
  ".1.1122211.1.",
  "111.12221.111",
  "11..11111..11",
  "1...1...1...1",
  "......3......",
  ".....3.3.....",
];
const moonG = [
  "....11111....",
  "..11.....11..",
  ".1..11......1",
  ".1.1..1.....1",
  "1.....11.....",
  "1...1...1...1",
  "1..11.......1",
  ".1.......11.1",
  ".1..1.....1..",
  "..11.....11..",
  "....11111....",
].map((r) => r.padEnd(13, ".").slice(0, 13).replace(/^(.)(.*)$/, "$1$2"));
const crystalG = [
  "....1111.....",
  "..11....11...",
  ".1..2222..11.",
  "1..22..22...1",
  "1.22....22..1",
  "1.22..1.22.1.",
  ".1.222222.1..",
  "..1......11..",
  "...111111....",
];

const SPRITES: Record<PixelKind, string[]> = {
  tree: treeG, heap: heapG, graph: graphG, list: listG, array: arrayG,
  stack: stackG, queue: queueG, hash: hashG, rocket: rocketG, moon: moonG, crystal: crystalG,
};

const PALETTE: Record<string, string> = {
  "1": "rgb(var(--color-ink))",
  "2": "rgb(var(--color-ink-dim))",
  "3": "rgb(var(--color-ink-dim))",
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
  const w = Math.max(...rows.map((r) => r.length));
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
