---
name: playtest
description: Measure what the game's current numbers add up to. Generates many sektors the way the game does, plays each one, and reports where the configuration is weak — which requirements cannot be met, what every sektor is taxed by, which buildings are never worth putting up, and whether doing what a sektor asks beats ignoring it. Use whenever anything touching the economy changes (building inputs or outputs in buildings.md, scoring constants in Sektor.ts, location property limits, the creation algorithm, resource flags in resources.md), or when asked whether the game is too hard or too easy, or to compare the current numbers against the last report.
---

# Playtest

## Run it

```
cd playtest && npm run playtest -- --save
```

Takes under a minute. `--save` keeps the report under `playtest/reports/<date>-<commit>.md`.
Options: `--levels 1,4` `--runs 30` `--seed 1`.

Leave the seed alone unless you mean to. The same seed on the same commit gives the same report,
which is the only reason two reports can be compared at all.

Run with `--save` whenever the result is worth keeping — after a change to the economy, or before
starting one. Do not save half-finished experiments; a folder of near-identical reports is worse
than a few meaningful ones.

## Then compare it to the last one

1. `ls playtest/reports/` and read the most recent report before this one.
2. `git log --oneline <that report's commit>..HEAD` — that is the complete list of what could
   possibly explain any difference.
3. Report what moved, and tie each movement to a commit. A number that moved with nothing in the
   log to explain it means either the seed changed or something is not deterministic — say so
   rather than inventing a cause.

## Reading the report

Each section points at a different kind of problem.

**By level** — the headline. Completion rate should fall as levels climb; scores should not be
negative at any level. A sektor scoring below zero is one the player is better off never touching.
A low completion rate is ambiguous on its own: the harness plans a build rather than solving, so an
unfinished sektor may be one it could not play rather than one that cannot be played. Check a
single case with `--levels N --runs 1 --detail` before concluding the level is too hard.

**By what was required** — a resource asked for often and met rarely is either too dear to produce
or impossible with the buildings the sektor offered. This is the clearest single signal in the
report. Fixes live in the recipe that produces it, in what the generator puts in the palette
alongside it, or in the resource's worth.

**Doing the task against ignoring it** — if ignoring what a sektor asks pays better than doing it,
no amount of tuning the sektors will help, because the reward is in the wrong place. Look at
scoring constants and at any resource whose import or export is priced oddly.

**What the sektors buy** — what every sektor is taxed by regardless of what it was asked for. A
resource high in this table that nothing in the game produces is a permanent, unavoidable cost;
either give it a producer or reduce how much the recipes consume.

**Buildings never worth putting up** — content that exists and never earns its place. Usually its
outputs are local resources nothing requires, or its recipe costs more than it returns.

## What not to do

Do not work out the economics by reasoning over `buildings.md` by hand. That was tried at length
and gave three confidently wrong answers in a row, each from restating the game's rules in order to
reason about them — treating every input as imported, mispricing negative resources, and assuming a
requirement could be met by importing the resource and exporting it again, which the game does not
allow. The harness reads the real `Sektor.ts`, the real `createSektor`, and the real asset files.
When a claim about the economy is worth making, measure it.

If the harness cannot answer the question, extend the harness. The details of how it plays, and
what it does not yet do, are in `plans/plan_030_automated_playtesting.txt`.
