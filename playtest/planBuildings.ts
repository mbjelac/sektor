import { BuildingDefinition } from "../frontend/src/sektor/buildings/parseBuildingDefinitions";
import { SektorData } from "../shared/sektorData";

// One thing one building can be set to do.
export interface BuildingPlan {
  buildingName: string;
  functionIndex: number;
  count: number;
}

const PLANNING_ROUNDS = 400;

// A sektor is a standing flow, not a story with a beginning: nothing has to be built before
// anything else, it only has to add up in the end. So rather than feeling its way one building at a
// time — which cannot work, because half a production chain always breaks the restrictions the
// whole chain was built to satisfy — this works out what the sektor has to make, and puts up
// whatever it takes to make it, over and over until the sums come out.
export function planBuildings(sektorData: SektorData, buildingDefinitions: BuildingDefinition[]): BuildingPlan[] {
  const plans: BuildingPlan[] = [];

  for (let round = 0; round < PLANNING_ROUNDS; round++) {
    const shortage = worstShortage(sektorData, buildingDefinitions, plans);
    if (!shortage) return plans;

    const producer = cheapestProducer(sektorData, buildingDefinitions, shortage.resource);
    // Nothing the sektor is allowed to build makes it, so no plan can cover it.
    if (!producer) return plans;

    const existing = plans.find(plan =>
      plan.buildingName === producer.buildingName && plan.functionIndex === producer.functionIndex
    );
    if (existing) existing.count++;
    else plans.push({ ...producer, count: 1 });
  }

  return plans;
}

// A resource is short when the sektor needs more of it than it makes and may bring in: what is
// required of it has to be made here, since importing a resource can only cover what is used, never
// what is sent out. A resource under no restriction and required of nobody is never short — it can
// simply be bought.
function worstShortage(
  sektorData: SektorData,
  buildingDefinitions: BuildingDefinition[],
  plans: BuildingPlan[],
): { resource: string; amount: number } | null {
  const { produced, consumed } = flows(sektorData, buildingDefinitions, plans);

  let worst: { resource: string; amount: number } | null = null;
  for (const resource of new Set([...produced.keys(), ...consumed.keys(), ...sektorData.exportRequirements.map(r => r.name)])) {
    const required = sektorData.exportRequirements.find(requirement => requirement.name === resource)?.value ?? 0;
    const restriction = sektorData.importRestrictions.find(entry => entry.name === resource);
    const allowedImport = required > 0 ? 0 : restriction?.value;
    if (allowedImport === undefined) continue;

    const shortage = (consumed.get(resource) ?? 0) + required - (produced.get(resource) ?? 0) - allowedImport;
    if (shortage > 0.001 && (!worst || shortage > worst.amount)) worst = { resource, amount: shortage };
  }
  return worst;
}

function flows(sektorData: SektorData, buildingDefinitions: BuildingDefinition[], plans: BuildingPlan[]) {
  const produced = new Map<string, number>();
  const consumed = new Map<string, number>();

  for (const plan of plans) {
    const buildingFunction = buildingDefinitions
      .find(definition => definition.name === plan.buildingName)!
      .buildingFunctions[plan.functionIndex];

    for (const input of buildingFunction.inputs) {
      consumed.set(input.name, (consumed.get(input.name) ?? 0) + input.value * plan.count);
    }
    for (const output of buildingFunction.outputs) {
      const amount = outputAmount(sektorData, output);
      produced.set(output.name, (produced.get(output.name) ?? 0) + amount * plan.count);
    }
  }

  return { produced, consumed };
}

// An output named after a location property is worth whatever the best free ground holds of it, and
// the player would of course build there.
function outputAmount(sektorData: SektorData, output: { value?: number; locationProperty?: string }): number {
  if (output.value !== undefined) return output.value;
  if (output.locationProperty === undefined) return 0;
  const matrix = sektorData.locationProperties[output.locationProperty];
  if (!matrix) return 0;
  return Math.max(...matrix.flat());
}

// Of everything the sektor allows which makes this resource, the one which makes most of it per
// building is the one which takes up least of the ground.
function cheapestProducer(
  sektorData: SektorData,
  buildingDefinitions: BuildingDefinition[],
  resource: string,
): { buildingName: string; functionIndex: number } | null {
  let best: { buildingName: string; functionIndex: number } | null = null;
  let bestAmount = 0;

  for (const buildingDefinition of buildingDefinitions) {
    buildingDefinition.buildingFunctions.forEach((buildingFunction, functionIndex) => {
      for (const output of buildingFunction.outputs) {
        if (output.name !== resource) continue;
        const amount = outputAmount(sektorData, output);
        if (amount > bestAmount) {
          bestAmount = amount;
          best = { buildingName: buildingDefinition.name, functionIndex };
        }
      }
    });
  }

  return best;
}
