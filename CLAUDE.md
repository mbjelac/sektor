# Sektor

## Workflow

1. Read the last plan file in `plans/` before starting any work.
2. Plan files may have introductory text before the numbered sections. This text describes the general idea and concepts behind the plan. Read and understand it before executing any steps.
3. Each plan file has numbered sections starting with #N where N is the section number and continuing with the section's name
4. Underneath each section heading are bullets with dashes
5. Each bullet is a step
6. Execute only one step at a time, then report what was done.
7. Wait for user approval before proceeding to the next step.
8. Do not skip ahead or combine steps.
9. When user instructs that a step is done, mark it done by adding [done] after the dash, like this: "- [done] <step instruction>"
10. When all steps in a section are done, ask the user to confirm the section is done. Only after user confirms, mark the section as done by adding [done] after the #N numbering, like this: "#13 [done] <section name>".
11. steps can have sub-steps described in indented bullets, which can also have sub-bullets, etc. do those without waiting for approval.
12. User may nudge you forward  (approving your work) by instructions like "go", "proceed", "continue", etc. if unsure, ask the user does the instruction mean to continue with plan.
13. When user approves a step, FIRST mark it [done] in the plan file, THEN start the next step. Never begin new work without marking the previous step done.
14. Always stop after marking an entire section as [done]. Do not begin the next section until the user gives a fresh instruction, even if their approval sounded like a go-ahead.

## Code style

- Functions/methods should be ordered in the file in order of calling — callers before callees. A method declaration should be below the last call of that method.
- Always use full, domain-specific variable names — no abbreviations (e.g. `building` not `b`, `buildingDefinition` not `def`, `buildingFunction` not `fn`).
- File naming: display files (code for displaying stuff in a web browser, using p5.js) use `.ui.ts` extension. API files (getting and setting data to backend) use `.api.ts` extension.

## Testing

- Use `toEqual(<expected>)` for assertions, not `expect.arrayContaining` or similar matchers.
- Use simple made-up test data instead of real data from asset files. When dependencies are injected (e.g. `BuildingDefinition[]` into Sektor), define minimal inline test data with readable names.
- Never have two expects in a test. Combine actual and expected data into one structure and assert with a single `expect`.

## Modules

- **architect** — editor for designing 3D shapes from text instructions, with visual UI controls
- **frontend** — renders 3D scenes using shapes defined in the architect module
- **shared** — common rendering and parsing code used by both architect and frontend
