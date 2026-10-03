import type { ReactElement } from "react";
import { cn } from "../../lib/utils";

export type PixelIconName = "trophy" | "flame" | "moon" | "sunrise" | "bug" | "brain" | "swords" | "code" | "coins";

// Game-style pixel art with a dark outline. Each letter maps to a fixed colour in PALETTE.
const ICONS: Record<PixelIconName, string[]> = {
  "trophy": [
    "...oooooooo...",
    ".ooGGgggghhoo.",
    "oggGGgggghhhho",
    "ogoGggggghhoho",
    "ogoGggggghhoho",
    "oggGggggghhhho",
    ".ooGggggghhoo.",
    "...oGggggho...",
    "....ooghoo....",
    "....ooghoo....",
    "...oGGgggho...",
    "...ohhhhhho...",
    "....oooooo...."
  ],
  "flame": [
    "......o......",
    ".....ono.....",
    "....onnno....",
    "...onnrnno...",
    "..onnrrrnno..",
    ".onnrrrrrnno.",
    ".onrrryrrrno.",
    ".onrryyyrrno.",
    ".onrryyyrrno.",
    "..onrryrrno..",
    "...onrrrno...",
    "....onnno....",
    ".....ooo....."
  ],
  "moon": [
    ".....ooo.....",
    "...ooSSSo....",
    "..oSSSoo.....",
    ".oSSSo.......",
    ".oSSSo.......",
    "oSSsSo.......",
    "oSSSSo.......",
    "oSSSso.......",
    ".oSssso......",
    ".osssssooo...",
    "..ossssssso..",
    "...oosssoo...",
    ".....ooo....."
  ],
  "sunrise": [
    "........o........",
    "...o...oyo...o...",
    "..oyo..oyo..oyo..",
    "...oyo.ooo.oyo...",
    "....o.oyyyo.o....",
    ".....oyyyyyo.....",
    "....oyyyyyyyo....",
    "...onnnnnnnnno...",
    ".ooonnnnnnnnnooo.",
    "obbbbbbbbbbbbbbbo",
    "occccccccccccccco",
    ".ooooooooooooooo."
  ],
  "bug": [
    "..o.......o..",
    ".oeo.....oeo.",
    "..oeoooooeo..",
    "...oeeeeeo...",
    "...oeweweo...",
    ".ooeeeeeeeoo.",
    "oeeeEeeeEeeeo",
    ".ooeeeeeeeoo.",
    "oeeeeEeEeeeeo",
    ".ooeeeeeeeoo.",
    "oeeeEeeeEeeeo",
    ".oooeeeeeooo.",
    "....ooooo...."
  ],
  "brain": [
    "......ooo......",
    "...oooKmkooo...",
    "..oKKKKmkkkko..",
    ".oKKKKkmkkkkko.",
    ".oKKmmkmkkkkko.",
    "oKKKkkkmkmmkkko",
    "oKKmmkkmkkkkkko",
    ".okkkkkkkmmkko.",
    ".okkkkmkmkkkko.",
    "..okkkkkkkkko..",
    "...oookkkooo...",
    "......ooo......"
  ],
  "swords": [
    "...............",
    "..oo......oo...",
    ".oSwo....owSo..",
    "..oSwo..owSo...",
    "...oSwoowSo....",
    "....oSSSSo.....",
    ".....oSSo......",
    "....oSSSSo.....",
    "...oSSooSSo....",
    "..oSSogooSgo...",
    "..oghoogoghgo..",
    "..ohgo.ogogho..",
    ".ohoo...o.ooho.",
    "..o.........o..",
    "..............."
  ],
  "code": [
    "....oo...ooo....",
    "...oBBo.oPBBo...",
    "..oBBo.oPPoBBo..",
    ".oBBo..oPPooBBo.",
    "oBBo..oPPo..oBBo",
    ".oBBo.oPPo.oBBo.",
    "..oBBoPPo.oBBo..",
    "...oBBPPooBBo...",
    "....oooo..oo....",
    "................"
  ],
  "coins": [
    "....ooo....",
    "..ooGGGoo..",
    ".oGGGGGggo.",
    ".oGGGhgggo.",
    "oGGGGhgggho",
    "oGGGghgghho",
    "oGGgghghhho",
    ".oggghhhho.",
    ".oggghhhho.",
    "..oohhhoo..",
    "....ooo...."
  ]
};

const PALETTE: Record<string, string> = {
  "o": "#161925",
  "w": "#FFFFFF",
  "g": "#F5B93A",
  "G": "#FFE08A",
  "h": "#B97A12",
  "r": "#E5483C",
  "n": "#F58A2E",
  "y": "#FFD23F",
  "b": "#6c90c6",
  "B": "#A9C2E8",
  "c": "#0656a4",
  "p": "#8778ED",
  "P": "#B7ADF5",
  "k": "#F08FB0",
  "K": "#FFC2D6",
  "m": "#C25577",
  "e": "#4CAF6A",
  "E": "#8BE0A0",
  "s": "#9AA3BF",
  "S": "#DDE3F0"
};

interface PixelIconProps {
  name: PixelIconName;
  /** pixel scale: 1 = about 14px tall, 3 = about 40px tall */
  scale?: number;
  className?: string;
}

export default function PixelIcon({ name, scale = 1, className }: PixelIconProps) {
  const rows = ICONS[name];
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
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {rects}
    </svg>
  );
}
