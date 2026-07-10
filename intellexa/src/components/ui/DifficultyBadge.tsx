import BadgePill from "./BadgePill";
import type { Difficulty } from "../../types";

const map: Record<Difficulty, "success" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
};

export default function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <BadgePill variant={map[difficulty]}>{difficulty}</BadgePill>;
}
