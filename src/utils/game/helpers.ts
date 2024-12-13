import { Positions } from "../types/types";
import { HOME_ENTRANCE, HOME_POSITIONS, TURNING_POINTS } from "./constants";
export const getIncrementedPosition = (
  positions: Positions,
  player: string,
  piece: number
) => {
  const currentPosition = positions[player][piece];

  if (currentPosition === TURNING_POINTS[player]) {
    return HOME_ENTRANCE[player][0];
  } else if (currentPosition === 51) {
    return 0;
  }

  return currentPosition + 1;
};
export const hasPlayerWon = (positions: Positions, player: string) => {
  return [0, 1, 2, 3].every(
    (piece) => positions[player][piece] === HOME_POSITIONS[player]
  );
};
