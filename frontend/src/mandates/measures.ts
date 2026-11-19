import { DeforestationCriterion, PollutionCriterion } from "./mandates.api";
import { PlayerSektor } from "./sektorsMovingResource";
import { totalDeforestation } from "../sektor/deforestation";
import { totalPollution } from "../sektor/pollution";

// A criterion asking for no more than so much of what the player's sektors do to the planet, rather
// than of a resource.
export type MeasureCriterion = DeforestationCriterion | PollutionCriterion;

// What a criterion of a measure is told by: the measure's name, the picture standing for it, and how
// much of it the player's sektors come to between them.
export interface Measure {
  name: string;
  icon: string;
  playerAmount: (playerSektors: PlayerSektor[]) => number;
}

const MEASURES: Record<MeasureCriterion["type"], Measure> = {
  // A forest on fire.
  maximumDeforestation: {
    name: "Deforestation",
    icon: "\u{1F333}\u{1F525}",
    playerAmount: playerSektors => totalDeforestation(playerSektors.map(playerSektor => playerSektor.ecosystem)),
  },
  // A factory.
  maximumPollution: {
    name: "Pollution",
    icon: "\u{1F3ED}",
    playerAmount: playerSektors => totalPollution(playerSektors.map(playerSektor => playerSektor.pollution)),
  },
};

export function measureOf(criterion: MeasureCriterion): Measure {
  return MEASURES[criterion.type];
}
