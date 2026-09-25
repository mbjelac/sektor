---
name: draw-building
description: Load SGL (Sektor Graphics Language), the Sektor shape DSL (bodies, height, placement, colors, animation) into context for drawing in the scratch file. Use when asked to draw, add, move, recolor or animate 3D objects — buildings, pyramids, rings of spheres, grids of cubes — in the scratch_sektor.txt DSL.
---

# draw-building

Knowledge only. Invoking this skill loads the DSL below into context and **changes nothing** —
it does not read, write or otherwise touch the scratch file. Wait for the user's actual drawing
instruction.

## SGL — Sektor Graphics Language

The DSL described here is called **SGL**, short for **Sektor Graphics Language**. Wherever "SGL"
appears — the `.sgl` files under `frontend/src/assets/` (e.g. the terrain elevation pieces), or the
code blocks under the `## Render` headings in `frontend/src/assets/terrain.md` — it means this
language, and everything below applies to it.

### Generators

Before writing a new script to generate SGL, check `tools/sgl/generator/` — reuse or extend what
is there.

- `tools/sgl/generator/terrain/middle_elevations.py` — writes
  `frontend/src/assets/terrain/grassland/elevations/middle/<edge><variant>.sgl` (edge = e/n/s/w,
  variant = 0–9): for each, a whole grassy rocky outcrop with rocks piled up towards that edge,
  of which only the triangle facing that edge is kept. Fixed seed; rerunning reproduces the files.
- `tools/sgl/generator/terrain/outcrop.py` — shared helpers: random core rocks, rock palette,
  tree sizes and colours, pri5 rock geometry, placing trees on rock roofs.

## The working file

```
/Users/mbjelac/Library/Application Support/JetBrains/IntelliJIdea2026.2/scratches/scratch_sektor.txt
```

Always this file, regardless of the working directory. Nothing in the repo reads it — the user
pastes its contents into the architect editor — so it is a free-form canvas, not source code.

One body per line. Lines that do not start with a body keyword are ignored by the parser, so
blank lines are free and are used to group related bodies (a row, an edge, a ring). Preserve
that grouping, and preserve hand-placed lines verbatim unless told otherwise.

The DSL is parsed by `shared/parseCommands.ts` and drawn by `shared/applyCommands.ts` plus
`shared/primitive/*`. When something below needs confirming, read those — they are the authority.

## Line shape

```
<body> <modifier> <modifier> ...
```

The body keyword starts the line; modifiers follow in any order.

| Body | What it is |
|---|---|
| `pyr3`…`pyr9` | pyramid on an n-gon base (`pyr` alone = `pyr4`) |
| `pri3`…`pri9` | prism on an n-gon base (`pri4` = a box) |
| `sph` | sphere / ellipsoid |
| `cyl` | cylinder |
| `con` | cone |
| `tor` | torus, lying flat |

## Modifiers

| Modifier | Meaning |
|---|---|
| `t(x,y,z)` | position — **x and y are the ground plane, z is height** |
| `s(x,y,z)` or `s(n)` | size as a percentage of the 100-unit block; the third value is the height |
| `r(a,b,c)` | rotation in degrees: **a spins about the vertical axis**, b tips about the x axis, c tips about the y axis |
| `c(#rrggbb)` or `c(#rrggbbaa)` | color; alpha < ff makes it transparent |
| `h(n)` | hollow it out, 0–100 |
| `f(n)` | cut the top off a `pyr`/`con`, 0–100 |

Position and size are in the same units: `t(24,24,3)` with `s(60,60,40)` is a body 60 units wide
standing at x=24, y=24.

`s(n)` scales all three axes alike. Scale values below 1 are clamped to 1, and `h()`/`f()` are
clamped to 100.

## Where a body actually sits

Every body stands on a floor plane **`0.075 × s_z` above its `t` z** — so `t` z is not the bottom
of the body, and two bodies with different heights and the same `t` z do not sit level. These
formulas are what to compute with:

| | Height above the ground | Horizontal size |
|---|---|---|
| base of any body | `t_z + 0.075·s_z` | — |
| top of `pri`/`cyl` | `t_z + 1.075·s_z` (so it is `s_z` tall) | — |
| apex of `pyr`/`con` | `t_z + 1.075·s_z` | — |
| top of a cut-off `pyr`/`con` with `f(p)` | `t_z + (1.075 − p/100)·s_z` | base width `× p/100` |
| centre of `sph` | `t_z + 0.575·s_z` | radii `0.5·s_x`, `0.5·s_y`, `0.5·s_z` |
| centre of `tor` (default `h`) | `t_z + 0.2417·s_z` | outer radius `0.667·s_x` |

Note `f(p)`: a **larger** p cuts **more** off, leaving a shorter body with a **wider** top.

### Footprints

Both prisms and pyramids are built on a circle of radius `0.5·s_x`, but their first vertex sits at
a different angle, so a 4-sided one of each is turned 45° from the other:

- **`pri4`** — vertices at 45°, 135°, 225°, 315°: flat sides face the axes, and the square is
  `0.707·s_x` across, **not** `s_x`. A `pri4 s(59,59,2) t(24,24,7)` reaches only to 24 ± 20.86.
- **`pyr4`** — vertices on the axes: a diamond. Add `r(45,0,0)` to spin it into a square with
  flat sides facing the axes, `0.707·s_x` across.

So a `pri4` cap and an unrotated `pyr4` below it do **not** line up. Check which one is in play
before placing anything along an edge.

## Animation

| Modifier | Meaning |
|---|---|
| `at(dx,dy,dz,dt[,pause])` | glide by (dx,dy,dz) over `dt` ms, then back, pausing `pause` ms at each end; every body with this runs **in step** |
| `atr(...)` | same arguments, but each line gets its **own random start delay** of 0–2000 ms, so identical bodies drift apart |
| `ar(d1,d2,d3,stepDelay)` | add these degrees every `stepDelay` ms — an endless spin; random start delay |
| `act(#color,dt1,dt2[,dt3])` | hold the base color `dt1` ms, `#color` for `dt2` ms, base again for `dt3` ms; in sync across lines |
| `acg(#color,dt)` | fade base ↔ `#color`, `dt` ms each way; random start delay |

Animation advances in 20 ms steps, so anything below that is invisible. To make a crowd of
identical bodies feel alive, use `atr`/`ar` and also vary a number per line (a pause, a delay)
rather than emitting the same line many times.

## Hard rules

- **Integers only.** Every numeric argument is matched as `-?\d+`. `t(5,5,11.5)` does not fail
  loudly — the whole `t(...)` silently fails to match and the body lands at the origin.
- Each modifier is found by scanning the line, so the **first** match wins if one appears twice.
- An unrecognised line is dropped in silence. A typo'd keyword means a missing body, not an error.

## Working practice

- **Do the arithmetic before writing lines.** Use the formulas above to check that what is being
  placed actually lands where intended — resting on a face, clearing a neighbour, inside a
  footprint — rather than eyeballing the numbers.
- **Generate repetitive geometry with a throwaway script** (rings, grids, rows) instead of typing
  out dozens of near-identical lines; then print the result back and sanity-check counts,
  duplicate positions, and the extremes.
- **Derive intent from what is already there.** Existing bodies encode the spacing, the inset from
  an edge, the alternation rhythm and the height band being used. Measure them and match.
- Say plainly which bodies were touched and which were left alone.
