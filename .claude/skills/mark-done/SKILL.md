---
name: mark-done
description: Mark a plan section or step [done] in the newest plan file in plans/. Use when the user confirms a finished section (they answer "done", "yes", "confirmed" to a request to confirm the section), and when marking a step done after finishing it. Never edit the plan file by hand for this.
---

# mark-done

One script does the marking. Do not read the plan file first and do not write a script of your
own — that is what this replaces.

## The user confirmed a section

```
"$(git rev-parse --show-toplevel)/.claude/skills/mark-done/mark-done.sh"
```

Marks the first section still without `[done]` in the newest plan file, which is the section
just confirmed. It prints the plan path and the line it marked.

If it prints `unmarked step:` lines, a step of that section was never marked — say so, rather
than letting it pass.

## A step is finished

```
"$(git rev-parse --show-toplevel)/.claude/skills/mark-done/mark-done.sh" --step "<the step's text, without the leading '- '>"
```

The text has to match the step's whole line exactly, so copy it from the plan.

The working directory wanders, so the script is called by its full path rather than a relative one.

## Another plan

Add `--plan <file>` to either form. Without it the newest `plans/plan_NNN_*.txt` is used.

## Nothing to mark

The script changes nothing and exits non-zero, saying why: there was no section left without
`[done]`, or no step with that exact text. Read the message rather than retrying.

## Report

One line: which section or step is now marked. Then stop — a section marked done ends the work
until the user gives a fresh instruction.
