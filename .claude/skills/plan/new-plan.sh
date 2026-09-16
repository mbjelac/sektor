#!/usr/bin/env bash
# Create the next plan file in plans/.
#
#   new-plan.sh --dry-run "fixing something"   -> prints target path + previous plan path
#   new-plan.sh "fixing something" < body.txt  -> writes body into the target path
#   cat <<EOF | new-plan.sh "fixing something"
#
# Exits non-zero with a message on stderr if the name is missing or the file already exists.

set -euo pipefail

projectRoot="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
plansDirectory="$projectRoot/plans"

dryRun=false
if [[ "${1:-}" == "--dry-run" ]]; then
  dryRun=true
  shift
fi

planName="${*:-}"
if [[ -z "${planName// }" ]]; then
  echo "usage: new-plan.sh [--dry-run] <plan name>" >&2
  exit 1
fi

mkdir -p "$plansDirectory"

previousPlanFile="$(ls "$plansDirectory" 2>/dev/null | grep -E '^plan_[0-9]{3}_.*\.txt$' | sort | tail -1)"

if [[ -n "$previousPlanFile" ]]; then
  highestPlanNumber=$((10#${previousPlanFile:5:3}))
else
  highestPlanNumber=0
fi
nextPlanNumber="$(printf '%03d' $((highestPlanNumber + 1)))"

planSlug="$(
  printf '%s' "$planName" \
    | tr '[:upper:]' '[:lower:]' \
    | tr -s '[:space:]' '_' \
    | sed -e 's/^_//' -e 's/_$//'
)"

planFile="$plansDirectory/plan_${nextPlanNumber}_${planSlug}.txt"

if $dryRun; then
  echo "next: $planFile"
  [[ -n "$previousPlanFile" ]] && echo "previous: $plansDirectory/$previousPlanFile"
  exit 0
fi

if [[ -e "$planFile" ]]; then
  echo "refusing to overwrite existing $planFile" >&2
  exit 1
fi

cat > "$planFile"

echo "created: $planFile"
