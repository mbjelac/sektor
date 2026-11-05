---
name: ready
description: Make a drafted plan ready — move plan_<name>.txt from plans/future/ into plans/ as plan_<NNN>_<name>.txt, numbered one higher than the highest existing plan. Use when the user says a plan is ready or invokes /ready with a plan name.
---

# ready

The script does everything. Do not compute, look up or rename anything yourself, and do NOT
read, edit or execute the plan.

If no argument was given, ask for the plan's name — that is the only question worth asking.

## Step 1: Run the script

```
.claude/skills/ready/ready-plan.sh "<the argument>" < /dev/null
```

Pass the argument exactly as the user gave it.

## Step 2: Report

Print the script's output verbatim — the success line or the error. Nothing else.
