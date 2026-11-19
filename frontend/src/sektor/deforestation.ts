// How much of the support the ecosystem had when the sektor was made it no longer has: every
// forest cut down, or every bit of its support used up in the sektor, is the sektor deforested,
// told against the support it started with.
export interface Deforestation {
  deforestation: number;
  initialEcosystemSupport: number;
  // The deforestation as a whole percentage of the initial support. A sektor which started with no
  // support had nothing to deforest, and stands at none.
  percentage: number;
}

export function sektorDeforestation(initialEcosystemSupport: number, ecosystemSupport: number): Deforestation {
  const deforestation = initialEcosystemSupport - ecosystemSupport;
  return {
    deforestation,
    initialEcosystemSupport,
    percentage: initialEcosystemSupport === 0 ? 0 : Math.round(deforestation / initialEcosystemSupport * 100),
  };
}

// How much a sektor's ecosystem was supported when the sektor was made, and how much it is now.
export interface SektorEcosystem {
  initialEcosystemSupport: number;
  ecosystemSupport: number;
}

// Sektors are deforested between them by all the support they started with less all the support they
// still give, so a sektor giving more than it started with makes up for one deforested.
export function totalDeforestation(sektorEcosystems: SektorEcosystem[]): number {
  const initialEcosystemSupport = sektorEcosystems
    .reduce((total, sektorEcosystem) => total + sektorEcosystem.initialEcosystemSupport, 0);
  const ecosystemSupport = sektorEcosystems
    .reduce((total, sektorEcosystem) => total + sektorEcosystem.ecosystemSupport, 0);
  return roundToOneDecimal(initialEcosystemSupport - ecosystemSupport);
}

// Support is given with a single decimal place, so rounding to it keeps the floating point noise out
// of the support added up from it.
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
