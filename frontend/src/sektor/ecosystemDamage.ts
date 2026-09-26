import { ResourceThroughput } from "../../../shared/sektorData";
import { ECOSYSTEM_SUPPORT_RESOURCE } from "./forest";

// How much of the support the ecosystem had when the sektor was made it no longer has: every
// forest cut down, or every bit of its support used up in the sektor, is support the ecosystem
// has lost, told against what it started with.
export interface EcosystemDamage {
  damage: number;
  initialEcosystemSupport: number;
  // The damage as a whole percentage of the initial support. A sektor which started with no
  // support had none to lose, and stands at none.
  percentage: number;
}

export function ecosystemDamage(initialEcosystemSupport: number, exports: ResourceThroughput[]): EcosystemDamage {
  const exportedEcosystemSupport = exports.find(throughput => throughput.name === ECOSYSTEM_SUPPORT_RESOURCE)?.value ?? 0;
  const damage = initialEcosystemSupport - exportedEcosystemSupport;
  return {
    damage,
    initialEcosystemSupport,
    percentage: initialEcosystemSupport === 0 ? 0 : Math.round(damage / initialEcosystemSupport * 100),
  };
}
