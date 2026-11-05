#!/usr/bin/env bash
# Move an unnumbered plan from plans/future/ into plans/, giving it the next plan number.
#
#   ready-plan.sh "foo"   -> plans/future/plan_foo.txt  becomes  plans/plan_<NNN>_foo.txt
#
# On success prints the one-line markdown report, e.g. "Moved to [plans/plan_064_foo.txt](...)."
#
# Also accepts "plan_foo", "plan_foo.txt" or a path to the file.
# Exits non-zero with a message on stderr if the name is missing, the source file does not exist
# or the target already exists.

set -euo pipefail

projectRoot="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
plansDirectory="$projectRoot/plans"

planArgument="${*:-}"
if [[ -z "${planArgument// }" ]]; then
  echo "usage: ready-plan.sh <plan name>" >&2
  exit 1
fi

if [[ -f "$planArgument" ]]; then
  sourcePlanFile="$planArgument"
else
  planName="$(basename "$planArgument")"
  planName="${planName%.txt}"
  planName="${planName#plan_}"
  sourcePlanFile="$plansDirectory/future/plan_${planName}.txt"
fi

if [[ ! -f "$sourcePlanFile" ]]; then
  echo "no such plan file: $sourcePlanFile" >&2
  exit 1
fi

planName="$(basename "$sourcePlanFile")"
planName="${planName%.txt}"
planName="${planName#plan_}"

mkdir -p "$plansDirectory"

previousPlanFile="$(ls "$plansDirectory" 2>/dev/null | grep -E '^plan_[0-9]{3}_.*\.txt$' | sort | tail -1)"

if [[ -n "$previousPlanFile" ]]; then
  highestPlanNumber=$((10#${previousPlanFile:5:3}))
else
  highestPlanNumber=0
fi
nextPlanNumber="$(printf '%03d' $((highestPlanNumber + 1)))"

planFile="$plansDirectory/plan_${nextPlanNumber}_${planName}.txt"

if [[ -e "$planFile" ]]; then
  echo "refusing to overwrite existing $planFile" >&2
  exit 1
fi

mv "$sourcePlanFile" "$planFile"

relativePlanFile="${planFile#"$projectRoot"/}"
echo "Moved to [$relativePlanFile]($relativePlanFile)."
