---
name: update-model
description: Regenerate model.md in the repo root — the mermaid graph of buildings (rectangles) and resources (rounded rectangles) — from the current frontend/src/assets/buildings.md. Use when asked to update, refresh or regenerate the model, model.md or the buildings/resources graph.
---

# update-model

One script does the work. Do not edit model.md by hand and do not write a script of your own.

```
"$(git rev-parse --show-toplevel)/.claude/skills/update-model/update-model.py"
```

It overwrites `model.md` from `buildings.md`:

- every resource listed before `->` in a building's `## Function` sections gets an arrow to that building
- every resource after `->` gets an arrow from that building to the resource
- `## Construction` materials are not drawn; buildings without functions are left out

It prints the path and how many buildings and resources it wrote.

## Report

One line with the printed counts.
