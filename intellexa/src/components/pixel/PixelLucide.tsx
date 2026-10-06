import type { CSSProperties, ReactElement, SVGProps } from "react";
import { cn } from "../../lib/utils";

// Pixel-art versions of the site's UI icons (16x16 grid, one colour = currentColor).
const BITMAPS: Record<string, string[]> = {
 "Menu": ["................", "................", "..xxxxxxxxxxxx..", "..xxxxxxxxxxxx..", "................", "................", "................", "..xxxxxxxxxxxx..", "..xxxxxxxxxxxx..", "................", "................", "................", "..xxxxxxxxxxxx..", "..xxxxxxxxxxxx..", "................", "................"],
 "Activity": [
  "................",
  ".....xx.........",
  ".....xx.........",
  "....xxxx........",
  "....xxxx........",
  "....xxxx........",
  "...xx..xx.......",
  ".xxxx..xx...xxx.",
  ".xxx...xx..xxxx.",
  ".......xx..xx...",
  "........xxxx....",
  "........xxxx....",
  "........xxxx....",
  ".........xx.....",
  ".........xx.....",
  "................"
 ],
 "ArrowDown": [
  "................",
  "................",
  "................",
  ".......xx.......",
  ".......xx.......",
  ".......xx.......",
  ".......xx.......",
  "...x...xx...x...",
  "...xx..xx..xx...",
  "...xxx.xx.xxx...",
  "....xxxxxxxx....",
  ".....xxxxxx.....",
  "......xxxx......",
  "................",
  "................",
  "................"
 ],
 "ArrowLeft": [
  "................",
  "................",
  "................",
  ".......xx.......",
  "......xx........",
  ".....xx.........",
  "....xx..........",
  "...xxxxxxxxxx...",
  "...xxxxxxxxxx...",
  "...xxx..........",
  "....xxx.........",
  ".....xxx........",
  "......xxx.......",
  "................",
  "................",
  "................"
 ],
 "ArrowUp": [
  "................",
  "................",
  "................",
  ".......xxx......",
  "......xxxxx.....",
  ".....xxxxxxx....",
  "....xx.xx.xxx...",
  "...xx..xx..xx...",
  "...x...xx...x...",
  ".......xx.......",
  ".......xx.......",
  ".......xx.......",
  ".......xx.......",
  "................",
  "................",
  "................"
 ],
 "Award": [
  ".......xx.......",
  ".....xxxxxx.....",
  "....xxx..xxx....",
  "...xxx....xxx...",
  "...xx......xx...",
  "...xx......xx...",
  "...xx......xx...",
  "....xx....xx....",
  "....xxxxxxxx....",
  "....xxxxxxxx....",
  "....xx....xx....",
  "....xx....xx....",
  "....xxxxxxxx....",
  "....xxxxxxxx....",
  "....xxx..xxx....",
  "....xx....xx...."
 ],
 "BarChart3": [
  "................",
  ".xx.............",
  ".xx.....x.......",
  ".xx.....xx......",
  ".xx.....xx......",
  ".xx.....xx.xx...",
  ".xx.....xx.xx...",
  ".xx.....xx.xx...",
  ".xx..x..xx.xx...",
  ".xx.xx..xx.xx...",
  ".xx.xx..xx.xx...",
  ".xx.xx..xx.xx...",
  ".xx.............",
  ".xxxxxxxxxxxxxx.",
  "..xxxxxxxxxxxxx.",
  "................"
 ],
 "Bell": [
  ".......xx.......",
  ".....xxxxxx.....",
  "....xxx..xxx....",
  "...xxx....xxx...",
  "...xx......xx...",
  "...xx......xx...",
  "...xx......xx...",
  "...xx......xx...",
  "..xxx......xxx..",
  "..xx........xx..",
  ".xxxxxxxxxxxxxx.",
  ".xxxxxxxxxxxxxx.",
  "................",
  "......xxxx......",
  "......xxxx......",
  ".......xx......."
 ],
 "BellOff": [
  ".x.....xx.......",
  "xxx..xxxxxx.....",
  ".xxx.xx..xxx....",
  "..xxx.....xxx...",
  "...xxx.....xx...",
  "...xxxx....xx...",
  "...xxxxx...xx...",
  "...xx.xxx..xx...",
  "..xxx..xxx..xx..",
  "..xx....xxx.xx..",
  ".xxxxxxxxxxx....",
  ".xxxxxxxxxxxx...",
  "...........xxx..",
  "......xxxx..xxx.",
  "......xxxx...xxx",
  ".......xx.....x."
 ],
 "CalendarClock": [
  ".....x....x.....",
  "..xxxxxxxxxxxx..",
  ".xxxxxxxxxxxxxx.",
  ".xx.xx....xx.xx.",
  ".xx..........xx.",
  ".xxxxxx......xx.",
  ".xxxxxx.xxxxx...",
  ".xx....xxxxxxx..",
  ".xx...xxx.x..xx.",
  ".xx...xx..xx.xxx",
  ".xx...xx..xx..xx",
  ".xx...xx..xxx.xx",
  ".xx...xx.....xx.",
  ".xxxxx.xxx..xxx.",
  "..xxxx..xxxxxx..",
  ".........xxx...."
 ],
 "Camera": [
  "................",
  "................",
  ".....xxxxxx.....",
  "....xxxxxxxx....",
  ".xxxxx....xxxxx.",
  "xxxxx......xxxxx",
  "xx....xxxx....xx",
  "xx...xxxxxx...xx",
  "xx...xx..xx...xx",
  "xx...xxxxxx...xx",
  "xx....xxxx....xx",
  "xx.....xx.....xx",
  "xxxxxxxxxxxxxxxx",
  ".xxxxxxxxxxxxxx.",
  "................",
  "................"
 ],
 "Check": [
  "................",
  "................",
  "................",
  "............xx..",
  "............xx..",
  "...........xx...",
  "..........xx....",
  "..xx.....xx.....",
  "..xxx...xx......",
  "...xxx.xx.......",
  "....xxxx........",
  ".....xx.........",
  "................",
  "................",
  "................",
  "................"
 ],
 "CheckCircle2": [
  "......xxxx......",
  "....xxxxxxxx....",
  "...xxxx..xxxx...",
  "..xxx......xxx..",
  ".xx..........xx.",
  ".xx..........xx.",
  "xxx......xx..xxx",
  "xx...xx.xxx...xx",
  "xx...xxxxx....xx",
  "xxx...xxx....xxx",
  ".xx..........xx.",
  ".xx..........xx.",
  "..xxx......xxx..",
  "...xxxx..xxxx...",
  "....xxxxxxxx....",
  "......xxxx......"
 ],
 "CheckSquare": [
  "................",
  "..xxxxxxxxxx....",
  ".xxxxxxxxxxx..xx",
  ".xx..........xx.",
  ".xx.........xx..",
  ".xx........xx...",
  ".xx.......xx.xx.",
  ".xx..xxx.xx..xx.",
  ".xx...xxxx...xx.",
  ".xx....xx....xx.",
  ".xx..........xx.",
  ".xx..........xx.",
  ".xx..........xx.",
  ".xxxxxxxxxxxxxx.",
  "..xxxxxxxxxxxx..",
  "................"
 ],
 "ChevronRight": [
  "................",
  "................",
  "................",
  ".....xx.........",
  ".....xxx........",
  "......xxx.......",
  ".......xxx......",
  "........xxx.....",
  "........xxx.....",
  ".......xxx......",
  "......xxx.......",
  ".....xxx........",
  ".....xx.........",
  "................",
  "................",
  "................"
 ],
 "Clock": [
  "......xxxx......",
  "....xxxxxxxx....",
  "...xxxx..xxxx...",
  "..xxx..xx..xxx..",
  ".xx....xx....xx.",
  ".xx....xx....xx.",
  "xxx....xx....xxx",
  "xx.....xx.....xx",
  "xx.....xxxx...xx",
  "xxx......xxx.xxx",
  ".xx..........xx.",
  ".xx..........xx.",
  "..xxx......xxx..",
  "...xxxx..xxxx...",
  "....xxxxxxxx....",
  "......xxxx......"
 ],
 "Clock3": [
  "......xxxx......",
  "....xxxxxxxx....",
  "...xxxx..xxxx...",
  "..xxx..xx..xxx..",
  ".xx....xx....xx.",
  ".xx....xx....xx.",
  "xxx....xx....xxx",
  "xx.....xxxx...xx",
  "xx.....xxxx...xx",
  "xxx..........xxx",
  ".xx..........xx.",
  ".xx..........xx.",
  "..xxx......xxx..",
  "...xxxx..xxxx...",
  "....xxxxxxxx....",
  "......xxxx......"
 ],
 "Coins": [
  ".........xxx....",
  "........xxxxxx..",
  ".......xxx..xxx.",
  "......xx.xx..xx.",
  "......xx.xxx..xx",
  "......xx..xx..xx",
  "...xx.xx..xx.xxx",
  "..xxx.xxx.x..xx.",
  ".xx....xxxxxxx..",
  "xxxxxx..xxxxx...",
  "xx.xxx..........",
  "xxx..xx.xx......",
  ".xx..xx.xx......",
  ".xxx..xxx.......",
  "..xxxxxx........",
  "....xxx........."
 ],
 "Crown": [
  "................",
  ".......xx.......",
  "......xxxx......",
  "xxx...xxxx...xxx",
  "xxxx.xxxxxx.xxxx",
  ".xxxxxx..xxxxxx.",
  ".xx.xx....xx.xx.",
  ".xx..........xx.",
  "..xx........xx..",
  "..xx........xx..",
  "..xxxxxxxxxxxx..",
  "...xxxxxxxxxx...",
  "................",
  "...xxxxxxxxxx...",
  "...xxxxxxxxxx...",
  "................"
 ],
 "FilePlus2": [
  "...xxxxxxx......",
  "..xxxxxxxxxx....",
  "..xx....xxxxx...",
  "..xx....xxxxxx..",
  "..xx....xxxxxx..",
  "..xx.....xxxxx..",
  "..xx........xx..",
  "..xx........xx..",
  "..xx........xx..",
  "..xx.........x..",
  "..xx......xx....",
  "..xx......xxx...",
  "..xx....xxxxxx..",
  "..xx.....xxxxx..",
  "..xxxxxxx.xx....",
  "...xxxxx...x...."
 ],
 "Flag": [
  "....xxx.........",
  "..xxxxxxx..xxx..",
  "..xx..xxxxxxxx..",
  "..xx.....xxxxx..",
  "..xx........xx..",
  "..xx........xx..",
  "..xx........xx..",
  "..xx........xx..",
  "..xxxxx.....xx..",
  "..xxxxxxx...xx..",
  "..xx...xxxxxxx..",
  "..xx.....xxx....",
  "..xx............",
  "..xx............",
  "..xx............",
  "..x............."
 ],
 "Flame": [
  "................",
  ".......xx.......",
  "......xxx.......",
  "......xxxx......",
  ".....xx.xx......",
  ".....xx..xx.....",
  "......xx.xxx....",
  "...xx.xx...xx...",
  "...xx.xx...xx...",
  "..xxxxxx....xx..",
  "..xxxxx.....xx..",
  "...xx......xx...",
  "...xx......xx...",
  "....xxx..xxx....",
  ".....xxxxxx.....",
  ".......xx......."
 ],
 "Hourglass": [
  "...xxxxxxxxxx...",
  "..xxxxxxxxxxxx..",
  "...xxx....xxx...",
  "....xx....xx....",
  "....xx....xx....",
  "....xxx..xxx....",
  ".....xxxxxx.....",
  "......xxxx......",
  "......xxxx......",
  ".....xxxxxx.....",
  "....xxx..xxx....",
  "....xx....xx....",
  "....xx....xx....",
  "...xxx....xxx...",
  "..xxxxxxxxxxxx..",
  "...xxxxxxxxxx..."
 ],
 "Info": [
  "......xxxx......",
  "....xxxxxxxx....",
  "...xxxx..xxxx...",
  "..xxx......xxx..",
  ".xx..........xx.",
  ".xx....xx....xx.",
  "xxx..........xxx",
  "xx.....xx.....xx",
  "xx.....xx.....xx",
  "xxx....xx....xxx",
  ".xx....xx....xx.",
  ".xx..........xx.",
  "..xxx......xxx..",
  "...xxxx..xxxx...",
  "....xxxxxxxx....",
  "......xxxx......"
 ],
 "LayoutDashboard": [
  "................",
  "..xxxxx..xxxxx..",
  ".xxxxxxxxxxxxxx.",
  ".xx...xxxx...xx.",
  ".xx...xxxxxxxxx.",
  ".xx...xx.xxxxxx.",
  ".xx...xx........",
  ".xxxxxxx.xxxxx..",
  "..xxxxx.xxxxxxx.",
  "........xx...xx.",
  ".xxxxxx.xx...xx.",
  ".xxxxxxxxx...xx.",
  ".xx...xxxx...xx.",
  ".xxxxxxxxxxxxxx.",
  "..xxxxx..xxxxx..",
  "................"
 ],
 "ListChecks": [
  "................",
  "................",
  "........xxxxxx..",
  ".....xx.xxxxxxx.",
  ".xxxxx..........",
  ".xxxx...........",
  "..xx............",
  "........xxxxxxx.",
  "........xxxxxxx.",
  ".....xx.........",
  "....xxx.........",
  ".xxxxx..........",
  "..xxx...xxxxxxx.",
  "...x....xxxxxx..",
  "................",
  "................"
 ],
 "Loader2": [
  "................",
  ".....xxxxx......",
  "....xxxxxxx.....",
  "...xxx..........",
  "..xx............",
  ".xxx............",
  ".xx.............",
  ".xx..........xx.",
  ".xx..........xx.",
  ".xx..........xx.",
  "..xx........xxx.",
  "..xx........xx..",
  "...xxx....xxx...",
  "....xxxxxxxx....",
  ".....xxxxxx.....",
  "................"
 ],
 "Lock": [
  ".......xx.......",
  ".....xxxxxx.....",
  "....xxx..xxx....",
  "....xx....xx....",
  "....xx....xx....",
  "....xx....xx....",
  "...xxxxxxxxxx...",
  ".xxxxxxxxxxxxxx.",
  ".xx..........xx.",
  ".xx..........xx.",
  ".xx..........xx.",
  ".xx..........xx.",
  ".xx..........xx.",
  ".xx..........xx.",
  ".xxxxxxxxxxxxxx.",
  "...xxxxxxxxxx..."
 ],
 "LogOut": [
  "................",
  "..xxxxx.........",
  ".xxxxxx.........",
  ".xx.............",
  ".xx.......xx....",
  ".xx.......xxx...",
  ".xx........xxx..",
  ".xx..xxxxxxxxxx.",
  ".xx..xxxxxxxxxx.",
  ".xx........xxx..",
  ".xx.......xxx...",
  ".xx.......xx....",
  ".xx.............",
  ".xxxxxx.........",
  "..xxxxx.........",
  "................"
 ],
 "Minus": [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "...xxxxxxxxxx...",
  "...xxxxxxxxxx...",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................"
 ],
 "Moon": [
  "................",
  ".....xxxx.......",
  "....xxxxx.......",
  "...xxxxxx.......",
  "..xx..xx........",
  ".xxx..xx........",
  ".xx....xx.......",
  ".xx....xxx..xxx.",
  ".xx.....xxxxxxx.",
  ".xx.......xxxxx.",
  ".xxx........xxx.",
  "..xx........xx..",
  "...xxx....xxx...",
  "....xxxxxxxx....",
  ".....xxxxxx.....",
  "................"
 ],
 "Palette": [
  "......xxxx......",
  "....xxxxxxxx....",
  "...xxxx..xxxx...",
  "..xxx...xx..xx..",
  ".xx.xxx.xx...xx.",
  ".xx.xxx.xx...xx.",
  "xxx.......xxx.xx",
  "xx.xx.....xxx.xx",
  "xx.xxx.......xx.",
  "xxx.x.......xxx.",
  ".xx.....xxxxxx..",
  ".xx.....xxxx....",
  "..xxx...xx......",
  "...xxxx.xx......",
  "....xxxxxx......",
  "......xxx......."
 ],
 "Pencil": [
  "............xx..",
  "..........xxxxx.",
  ".........xxx.xxx",
  "........xxxx..xx",
  ".......xxxxxxxx.",
  "......xxx..xxxx.",
  "......xx...xxx..",
  ".....xx...xxx...",
  "....xx...xxx....",
  "...xx...xxx.....",
  "..xx...xx.......",
  ".xx...xx........",
  ".xx..xx.........",
  ".xxxxx..........",
  "xxxxx...........",
  ".x.............."
 ],
 "Plus": [
  "................",
  "................",
  "................",
  ".......xx.......",
  ".......xx.......",
  ".......xx.......",
  ".......xx.......",
  "...xxxxxxxxxx...",
  "...xxxxxxxxxx...",
  ".......xx.......",
  ".......xx.......",
  ".......xx.......",
  ".......xx.......",
  "................",
  "................",
  "................"
 ],
 "Podium": [
  ".......x........",
  "......xxx.......",
  ".......xx.......",
  ".......xx.......",
  ".......xx.......",
  "................",
  ".....xxxxxx.....",
  ".....xxxxxx.....",
  "..xxxxx..xx.....",
  ".xxxxxx..xx.....",
  ".xx..xx..xxxxxx.",
  ".xx..xx..xxxxxx.",
  ".xx..xx..xx..xx.",
  ".xxxxxxxxxxxxxx.",
  "..xxxxxxxxxxxx..",
  "................"
 ],
 "Radio": [
  "................",
  "................",
  "...x........x...",
  "..xx........xx..",
  ".xxxxx....xxxxx.",
  ".xx.xx....xx.xx.",
  "xxxxx.xxxx.xxxxx",
  "xx.xx.xxxx.xx.xx",
  "xx.xx.xxxx.xx.xx",
  "xxxxx.xxxx.xxxxx",
  ".xx.xx....xx.xx.",
  ".xxxxx....xxxxx.",
  "..xx........xx..",
  "...x........x...",
  "................",
  "................"
 ],
 "RotateCcw": [
  "................",
  ".xx..xxxxxx.....",
  ".xx.xxxxxxxx....",
  ".xxxxx....xxx...",
  ".xxxxx......xx..",
  ".xxxxx......xxx.",
  ".............xx.",
  ".xx..........xx.",
  ".xx..........xx.",
  ".xx..........xx.",
  ".xxx........xxx.",
  "..xx........xx..",
  "...xxx....xxx...",
  "....xxxxxxxx....",
  ".....xxxxxx.....",
  "................"
 ],
 "Search": [
  "................",
  ".....xxxxx......",
  "...xxxxxxxx.....",
  "..xxx....xxx....",
  "..xx.......xx...",
  ".xx........xx...",
  ".xx.........xx..",
  ".xx.........xx..",
  ".xx........xxx..",
  ".xxx.......xx...",
  "..xx......xxx...",
  "...xxx...xxxx...",
  "....xxxxxxxxxx..",
  "......xxx...xxx.",
  ".............xx.",
  "................"
 ],
 "Send": [
  "..............x.",
  "...........xxxxx",
  "........xxxxxxx.",
  ".....xxxxxxxxxx.",
  "..xxxxxx..xxxxx.",
  "xxxxx....xxxxx..",
  "xxxxx...xxx.xx..",
  "..xxxxxxxx..xx..",
  "....xxxxx..xx...",
  "......xxx..xx...",
  ".......xx..xx...",
  ".......xxxxx....",
  "........xxxx....",
  "........xxxx....",
  ".........xx.....",
  ".........xx....."
 ],
 "Settings": [
  ".......xx.......",
  "......xxxx......",
  ".....xxxxxx.....",
  "..xxxxx..xxxxx..",
  ".xxxxxx..xxxxxx.",
  ".xx...xxxx...xx.",
  ".xxx.xxxxxx.xxx.",
  "..xx.xx..xx.xx..",
  "..xx.xx..xx.xx..",
  ".xxx.xxxxxx.xxx.",
  ".xx...xxxx...xx.",
  ".xxxxxx..xxxxxx.",
  "..xxxxx..xxxxx..",
  ".....xxxxxx.....",
  "......xxxx......",
  ".......xx......."
 ],
 "ShieldCheck": [
  ".......xx.......",
  "......xxxx......",
  "...xxxxxxxxxx...",
  "..xxxx....xxxx..",
  "..xx........xx..",
  "..xx........xx..",
  "..xx.....xx.xx..",
  "..xx.xx.xxx.xx..",
  "..xx.xxxxx..xx..",
  "..xx..xxx...xx..",
  "..xx........xx..",
  "..xxx......xxx..",
  "...xxx....xxx...",
  "....xxxxxxxx....",
  ".....xxxxxx.....",
  ".......xx......."
 ],
 "Sparkles": [
  ".......xx....x..",
  "......xxxx..xxx.",
  "......xxxx.xxxxx",
  "......xxxx..xxx.",
  "......xxxx...x..",
  ".....xxxxxx.....",
  ".xxxxxx..xxxxxx.",
  "xxxxxx....xxxxxx",
  "xxxxxx....xxxxxx",
  ".xxxxxx..xxxxxx.",
  ".....xxxxxx.....",
  ".xxx..xxxx......",
  ".xxxx.xxxx......",
  "xxxxx.xxxx......",
  ".xxxx.xxxx......",
  "..x....xx......."
 ],
 "Sun": [
  "................",
  ".......xx.......",
  "...x...xx...x...",
  "..xxx......xxx..",
  "...xx..xx..xx...",
  ".....xxxxxx.....",
  ".....xx..xx.....",
  ".xx.xx....xx.xx.",
  ".xx.xx....xx.xx.",
  ".....xx..xx.....",
  ".....xxxxxx.....",
  "...xx..xx..xx...",
  "..xxx......xxx..",
  "...x...xx...x...",
  ".......xx.......",
  "................"
 ],
 "Target": [
  "......xxxx......",
  "....xxxxxxxx....",
  "...xxxx..xxxx...",
  "..xxx.xxxx.xxx..",
  ".xx..xxxxxx..xx.",
  ".xx.xx....xx.xx.",
  "xxxxx.xxxx.xxxxx",
  "xx.xx.xxxx.xx.xx",
  "xx.xx.xxxx.xx.xx",
  "xxxxx.xxxx.xxxxx",
  ".xx.xx....xx.xx.",
  ".xx..xxxxxx..xx.",
  "..xxx.xxxx.xxx..",
  "...xxxx..xxxx...",
  "....xxxxxxxx....",
  "......xxxx......"
 ],
 "Timer": [
  "......xxxx......",
  "......xxxx......",
  "................",
  "......xxxx......",
  "....xxxxxxxx....",
  "...xxx....xxx...",
  "..xxx......xxx..",
  "..xx.....xx.xx..",
  "..xx...xxx..xx..",
  "..xx...xx...xx..",
  "..xx........xx..",
  "..xx........xx..",
  "...xx......xx...",
  "...xxxx..xxxx...",
  "....xxxxxxxx....",
  ".......xx......."
 ],
 "Trash2": [
  "......xxxx......",
  ".....xxxxxx.....",
  "....xxx..xxx....",
  ".xxxxxxxxxxxxxx.",
  ".xxxxxxxxxxxxxx.",
  "..xx........xx..",
  "..xx..x..x..xx..",
  "..xx..xxxx..xx..",
  "..xx..xxxx..xx..",
  "..xx..xxxx..xx..",
  "..xx..xxxx..xx..",
  "..xx..xxxx..xx..",
  "..xx........xx..",
  "..xxx......xxx..",
  "...xxxxxxxxxx...",
  "....xxxxxxxx...."
 ],
 "TrendingUp": [
  "................",
  "................",
  "................",
  "................",
  "..........xxxxxx",
  "..........xxxxxx",
  ".....xx.....xxxx",
  "....xxxx...xxxxx",
  "...xxxxxx.xx..xx",
  "..xxx..xxxx...x.",
  ".xxx....xx......",
  "xxx.............",
  "................",
  "................",
  "................",
  "................"
 ],
 "TriangleAlert": [
  "................",
  ".......xx.......",
  "......xxxx......",
  ".....xxxxxx.....",
  ".....xx..xx.....",
  "....xx.xx.xx....",
  "....xx.xx.xx....",
  "...xx..xx..xx...",
  "..xxx..xx..xxx..",
  "..xx........xx..",
  ".xxx........xxx.",
  ".xx....xx....xx.",
  "xx............xx",
  ".xxxxxxxxxxxxxx.",
  ".xxxxxxxxxxxxxx.",
  "................"
 ],
 "Trophy": [
  "....xxxxxxxx....",
  "...xxxxxxxxxx...",
  ".xxxx......xxxx.",
  "xxxxx......xxxxx",
  "xx.xx......xx.xx",
  "xxxxx......xxxxx",
  ".xxxx......xxxx.",
  "..xxx......xxx..",
  "....xx....xx....",
  ".....xxxxxx.....",
  "......xxxx......",
  ".....xxxxxx.....",
  "....xxx..xxx....",
  "....xx....xxx...",
  "..xxxxxxxxxxxx..",
  "..xxxxxxxxxxxx.."
 ],
 "User": [
  "................",
  "......xxxx......",
  ".....xxxxxx.....",
  ".....xx..xx.....",
  "....xx....xx....",
  "....xxx..xxx....",
  ".....xxxxxx.....",
  "......xxxx......",
  "................",
  "....xxxxxxxx....",
  "...xxxxxxxxxx...",
  "...xx......xx...",
  "..xx........xx..",
  "..xx........xx..",
  "...x........x...",
  "................"
 ],
 "UserRound": [
  "................",
  "......xxxx......",
  ".....xxxxxx.....",
  "....xxx..xxx....",
  "....xx....xx....",
  "....xx....xx....",
  "....xx....xx....",
  "....xxx..xxx....",
  ".....xxxxxx.....",
  "....xxxxxxxx....",
  "...xx......xx...",
  "..xx........xx..",
  "..xx........xx..",
  "..xx........xx..",
  "..x..........x..",
  "................"
 ],
 "Users": [
  "................",
  "....xxxx..xx....",
  "...xxxxxx.xxx...",
  "...xx..xx..xx...",
  "..xx....xx..xx..",
  "..xxx..xxx.xxx..",
  "...xxxxxx.xxx...",
  "....xxxx..xx....",
  "................",
  "..xxxxxxxx..xx..",
  ".xxxxxxxxxx.xxx.",
  ".xx......xx..xx.",
  "xx........xx..xx",
  "xx........xx..xx",
  ".x........x...x.",
  "................"
 ],
 "Volume2": [
  "................",
  "................",
  ".....xxx........",
  "....xxxx....xx..",
  ".xxxxxxx....xxx.",
  "xxxxx.xx..xx.xx.",
  "xxx...xx..xx.xxx",
  "xx....xx..xx..xx",
  "xx....xx..xx..xx",
  "xxx...xx..xx.xxx",
  "xxxxx.xx..xx.xx.",
  ".xxxxxxx....xxx.",
  "....xxxx....xx..",
  ".....xxx........",
  "................",
  "................"
 ],
 "X": [
  "................",
  "................",
  "................",
  "...xx......xx...",
  "...xxx....xxx...",
  "....xxx..xxx....",
  ".....xxxxxx.....",
  "......xxxx......",
  "......xxxx......",
  ".....xxxxxx.....",
  "....xxx..xxx....",
  "...xxx....xxx...",
  "...xx......xx...",
  "................",
  "................",
  "................"
 ],
 "XCircle": [
  "......xxxx......",
  "....xxxxxxxx....",
  "...xxxx..xxxx...",
  "..xxx......xxx..",
  ".xx..........xx.",
  ".xx..xx..xx..xx.",
  "xxx..xxxxxx..xxx",
  "xx....xxxx....xx",
  "xx....xxxx....xx",
  "xxx..xxxxxx..xxx",
  ".xx..xx..xx..xx.",
  ".xx..........xx.",
  "..xxx......xxx..",
  "...xxxx..xxxx...",
  "....xxxxxxxx....",
  "......xxxx......"
 ],
 "Zap": [
  ".........x......",
  "........xxx.....",
  ".......xxxxx....",
  "......xx.xx.....",
  ".....xx..xx.....",
  "....xx...xx.....",
  "...xx...xxxxxx..",
  "..xx.....xxxxx..",
  "..xxxxx.....xx..",
  "..xxxxxx...xx...",
  ".....xx...xx....",
  ".....xx..xx.....",
  ".....xx.xx......",
  "....xxxxx.......",
  ".....xxx........",
  "......x........."
 ]
};

export interface PixelLucideProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "color"> {
  size?: number | string;
  strokeWidth?: number | string;
  color?: string;
  className?: string;
  style?: CSSProperties;
}
export type LucideIcon = (props: PixelLucideProps) => ReactElement;

const PATHS: Record<string, string> = {};
for (const [name, rows] of Object.entries(BITMAPS)) {
  let d = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== "x") { x++; continue; }
      let run = 1;
      while (x + run < row.length && row[x + run] === "x") run++;
      d += `M${x} ${y}h${run}v1h-${run}z`;
      x += run;
    }
  });
  PATHS[name] = d;
}

function make(name: string): LucideIcon {
  return function PixelLucideIcon({ size = 24, strokeWidth: _sw, color, className, style, ...rest }: PixelLucideProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill={color ?? "currentColor"}
        shapeRendering="crispEdges"
        aria-hidden="true"
        className={cn("pixel-ico shrink-0", className)}
        style={style}
        {...rest}
      >
        <path d={PATHS[name]} />
      </svg>
    );
  };
}

export const Activity: LucideIcon = make("Activity");
export const ArrowDown: LucideIcon = make("ArrowDown");
export const ArrowLeft: LucideIcon = make("ArrowLeft");
export const ArrowUp: LucideIcon = make("ArrowUp");
export const Award: LucideIcon = make("Award");
export const BarChart3: LucideIcon = make("BarChart3");
export const Bell: LucideIcon = make("Bell");
export const BellOff: LucideIcon = make("BellOff");
export const CalendarClock: LucideIcon = make("CalendarClock");
export const Camera: LucideIcon = make("Camera");
export const Check: LucideIcon = make("Check");
export const CheckCircle2: LucideIcon = make("CheckCircle2");
export const CheckSquare: LucideIcon = make("CheckSquare");
export const ChevronRight: LucideIcon = make("ChevronRight");
export const Clock: LucideIcon = make("Clock");
export const Clock3: LucideIcon = make("Clock3");
export const Coins: LucideIcon = make("Coins");
export const Crown: LucideIcon = make("Crown");
export const FilePlus2: LucideIcon = make("FilePlus2");
export const Flag: LucideIcon = make("Flag");
export const Flame: LucideIcon = make("Flame");
export const Hourglass: LucideIcon = make("Hourglass");
export const Info: LucideIcon = make("Info");
export const LayoutDashboard: LucideIcon = make("LayoutDashboard");
export const ListChecks: LucideIcon = make("ListChecks");
export const Loader2: LucideIcon = make("Loader2");
export const Lock: LucideIcon = make("Lock");
export const LogOut: LucideIcon = make("LogOut");
export const Minus: LucideIcon = make("Minus");
export const Moon: LucideIcon = make("Moon");
export const Palette: LucideIcon = make("Palette");
export const Pencil: LucideIcon = make("Pencil");
export const Plus: LucideIcon = make("Plus");
export const Podium: LucideIcon = make("Podium");
export const Radio: LucideIcon = make("Radio");
export const RotateCcw: LucideIcon = make("RotateCcw");
export const Search: LucideIcon = make("Search");
export const Send: LucideIcon = make("Send");
export const Settings: LucideIcon = make("Settings");
export const ShieldCheck: LucideIcon = make("ShieldCheck");
export const Sparkles: LucideIcon = make("Sparkles");
export const Sun: LucideIcon = make("Sun");
export const Target: LucideIcon = make("Target");
export const Timer: LucideIcon = make("Timer");
export const Trash2: LucideIcon = make("Trash2");
export const TrendingUp: LucideIcon = make("TrendingUp");
export const TriangleAlert: LucideIcon = make("TriangleAlert");
export const Trophy: LucideIcon = make("Trophy");
export const User: LucideIcon = make("User");
export const UserRound: LucideIcon = make("UserRound");
export const Users: LucideIcon = make("Users");
export const Volume2: LucideIcon = make("Volume2");
export const X: LucideIcon = make("X");
export const XCircle: LucideIcon = make("XCircle");
export const Zap: LucideIcon = make("Zap");
export const Menu: LucideIcon = make("Menu");
