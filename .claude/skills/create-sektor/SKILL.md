---
name: create-sektor
description: Create a new named sektor and write it to sektor_<name>.json in the repository root. Use whenever the user says "create sektor X" (or "create a sektor called X" / "make sektor X"), where X is the sektor's name. Do not use for the bare prompt "create sektor" with no name — that is handled by an existing UserPromptSubmit hook which writes creator/created.json.
---

# Create sektor

Generates a sektor using the existing creator tooling (`creator/createSektor.ts`) and
writes it to `sektor_<name>.json` in the repository root.

## Steps

1. Take the sektor name from the user's prompt — the `X` in "create sektor X". Use it
   verbatim, minus surrounding quotes and whitespace.
2. Run the creator script from the repository root:

   ```bash
   ./creator/createSektorFile.sh <name>
   ```

3. Report the path of the file that was written.

## Notes

- Restrictions and requirements come from `creator/restrictions_requirements.ts`. If the
  user asks for specific import restrictions or export requirements as part of the
  request, edit that file first, then run the script.
- The script sources nvm and runs `nvm use` itself, so no separate node setup is needed.
- `sektor_*.json` is gitignored, so generated sektors are not committed.
- If `sektor_<name>.json` already exists, tell the user it will be overwritten and
  confirm before running.
