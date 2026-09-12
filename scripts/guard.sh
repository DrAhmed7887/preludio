#!/bin/sh
set -eu

patterns='film|video|movie|clip|animation|animated|cartoon|distraction|fear_archetype|calms|reduces?[[:space:]]+(pain|anxiety|distress|fear)|relieves?[[:space:]]+(pain|anxiety|distress|fear)|improves?[[:space:]]+cooperation|reduces?[[:space:]]+restraint'
excluded_paths='scripts/guard.sh|docs/vocabulary.md'
files=$(git ls-files --cached --others --exclude-standard | grep -E -v "^($excluded_paths)$")

if [ -n "$files" ] && printf '%s\n' "$files" | xargs grep -E -i -n "$patterns"; then
  echo "guard: prohibited vocabulary found" >&2
  exit 1
fi

if git log --format=%B | grep -E -i -n "$patterns"; then
  echo "guard: prohibited vocabulary found in commit history" >&2
  exit 1
fi

echo "guard: passed"
