export type BodyType =
  | "pyr3" | "pyr4" | "pyr5" | "pyr6" | "pyr7" | "pyr8" | "pyr9"
  | "pri3" | "pri4" | "pri5" | "pri6" | "pri7" | "pri8" | "pri9"
  | "sph" | "cyl" | "con" | "tor";

export interface AnimateTranslate {
  dx: number;
  dy: number;
  dz: number;
  dt: number;
}

export interface AnimateColorToggle {
  color: string;
  dt1: number;
  dt2: number;
  dt3: number;
}

export interface AnimateColorGradual {
  color: string;
  dt: number;
}

export interface CreateBody {
  type: BodyType;
  translate: [number, number, number] | null;
  rotate: [number, number, number] | null;
  scale: [number, number, number] | null;
  color: string | null;
  animateTranslate: AnimateTranslate | null;
  animateColorToggle: AnimateColorToggle | null;
  animateColorGradual: AnimateColorGradual | null;
}

export function parseCommands(text: string): CreateBody[] {
  return text.split("\n").map(parseLine).filter((cmd): cmd is CreateBody => cmd !== null);
}

function parseLine(line: string): CreateBody | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const pyrMatch = trimmed.match(/^pyr([3-9])?(?:\s|$)/);
  if (pyrMatch) {
    const sides = pyrMatch[1] ?? "4";
    const type = `pyr${sides}` as BodyType;
    const rest = trimmed.slice(pyrMatch[0].length).trim();
    return parseBody(type, rest);
  }

  const priMatch = trimmed.match(/^pri([3-9])(?:\s|$)/);
  if (priMatch) {
    const type = `pri${priMatch[1]}` as BodyType;
    const rest = trimmed.slice(priMatch[0].length).trim();
    return parseBody(type, rest);
  }

  for (const keyword of ["sph", "cyl", "con", "tor"] as const) {
    const match = trimmed.match(new RegExp(`^${keyword}(?:\\s|$)`));
    if (match) {
      const rest = trimmed.slice(match[0].length).trim();
      return parseBody(keyword, rest);
    }
  }

  return null;
}

function parseBody(type: BodyType, rest: string): CreateBody {
  const translate = parseTranslate(rest);
  const rotate = parseRotate(rest);
  const scale = parseScale(rest);
  const color = parseColor(rest);
  const animateTranslate = parseAnimateTranslate(rest);
  const animateColorToggle = parseAnimateColorToggle(rest);
  const animateColorGradual = parseAnimateColorGradual(rest);
  return {type, translate, rotate, scale, color, animateTranslate, animateColorToggle, animateColorGradual};
}

function parseTranslate(str: string): [number, number, number] | null {
  const match = str.match(/t\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
  if (!match) return null;
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

function parseRotate(str: string): [number, number, number] | null {
  const match = str.match(/r\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
  if (!match) return null;
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

function parseScale(str: string): [number, number, number] | null {
  const match3 = str.match(/s\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
  if (match3) {
    return [parseInt(match3[1]), parseInt(match3[2]), parseInt(match3[3])];
  }
  const match1 = str.match(/s\(\s*(-?\d+)\s*\)/);
  if (match1) {
    const v = parseInt(match1[1]);
    return [v, v, v];
  }
  return null;
}

function parseColor(str: string): string | null {
  const match = str.match(/c\(#([0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)\)/);
  if (!match) return null;
  return `#${match[1]}`;
}

function parseAnimateTranslate(str: string): AnimateTranslate | null {
  const match = str.match(/at\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
  if (!match) return null;
  return {
    dx: parseInt(match[1]),
    dy: parseInt(match[2]),
    dz: parseInt(match[3]),
    dt: parseInt(match[4]),
  };
}

function parseAnimateColorToggle(str: string): AnimateColorToggle | null {
  const match = str.match(/act\(\s*#([0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*(?:,\s*(-?\d+)\s*)?\)/);
  if (!match) return null;
  return {
    color: `#${match[1]}`,
    dt1: parseInt(match[2]),
    dt2: parseInt(match[3]),
    dt3: match[4] ? parseInt(match[4]) : 0,
  };
}

function parseAnimateColorGradual(str: string): AnimateColorGradual | null {
  const match = str.match(/acg\(\s*#([0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)\s*,\s*(-?\d+)\s*\)/);
  if (!match) return null;
  return {
    color: `#${match[1]}`,
    dt: parseInt(match[2]),
  };
}
