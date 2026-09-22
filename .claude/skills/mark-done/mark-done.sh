#!/usr/bin/env bash
# Mark a section or a step [done] in a plan file.
#
#   mark-done.sh                       -> marks the first section without [done]
#   mark-done.sh --step "<step text>"  -> marks that step (text without the leading "- ")
#   mark-done.sh --plan <file> ...     -> works on that plan instead of the newest one
#
# Prints the line it marked. Exits non-zero, changing nothing, when there is nothing to mark.

set -euo pipefail

projectRoot="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
plansDirectory="$projectRoot/plans"

planFile=""
stepText=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --plan) planFile="${2:-}"; shift 2 ;;
    --step) stepText="${2:-}"; shift 2 ;;
    *) echo "usage: mark-done.sh [--plan <file>] [--step <step text>]" >&2; exit 1 ;;
  esac
done

if [[ -z "$planFile" ]]; then
  newestPlanFile="$(ls "$plansDirectory" 2>/dev/null | grep -E '^plan_[0-9]{3}_.*\.txt$' | sort | tail -1)"
  if [[ -z "$newestPlanFile" ]]; then
    echo "no plan files in $plansDirectory" >&2
    exit 1
  fi
  planFile="$plansDirectory/$newestPlanFile"
fi

if [[ ! -f "$planFile" ]]; then
  echo "no such plan file: $planFile" >&2
  exit 1
fi

markedFile="$(mktemp)"
trap 'rm -f "$markedFile"' EXIT

# A step is matched by its whole line, so that text appearing inside another step never marks the
# wrong one. A section is found by being the first one still without [done].
awk -v stepText="$stepText" '
  BEGIN { marked = "" }
  marked == "" && stepText != "" && $0 == "- " stepText {
    sub(/^- /, "- [done] ")
    marked = $0
  }
  marked == "" && stepText == "" && /^#[0-9]+ / && $0 !~ /^#[0-9]+ \[done\]/ {
    sub(/^#[0-9]+/, "& [done]")
    marked = $0
  }
  { print }
  END { if (marked != "") print marked > "/dev/stderr" }
' "$planFile" > "$markedFile" 2> "$markedFile.marked"

if [[ ! -s "$markedFile.marked" ]]; then
  rm -f "$markedFile.marked"
  if [[ -n "$stepText" ]]; then
    echo "no step \"- $stepText\" left to mark in $planFile" >&2
  else
    echo "no section left to mark in $planFile" >&2
  fi
  exit 1
fi

cat "$markedFile" > "$planFile"
echo "$planFile"
cat "$markedFile.marked"
rm -f "$markedFile.marked"

# A section marked done while it still holds unmarked steps is worth knowing about.
if [[ -z "$stepText" ]]; then
  awk '
    /^#[0-9]+ / { inMarkedSection = ($0 ~ /^#[0-9]+ \[done\]/) }
    inMarkedSection && /^- / && $0 !~ /^- \[done\]/ { print "unmarked step: " $0 > "/dev/stderr" }
  ' "$planFile"
fi
