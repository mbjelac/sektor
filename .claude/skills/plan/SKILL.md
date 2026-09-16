---
name: plan
description: Create an EMPTY plan file in plans/ named plan_<NNN>_<name>.txt, numbered one higher than the highest existing plan. Never write content into it — the user writes the plan themselves. Use when the user asks to write, start, or add a plan.
---

# plan

Create an empty plan file. Nothing else.

Do NOT draft a plan, do NOT explore the code, do NOT read the previous plan, do NOT ask what
the plan is for. The user writes the plan's content themselves.

If no argument was given, ask for the plan's name — that is the only question worth asking.

## Step 1: Create the file

```
.claude/skills/plan/new-plan.sh "<the argument>" < /dev/null
```

The script picks the number, makes the slug and creates the file, empty.

## Step 2: Report

Print the created path. One line. Do not offer to fill it in.
