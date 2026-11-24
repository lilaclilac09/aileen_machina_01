## root cause / reason
Add a source-derived acceptance kit; no UI behavior changed.
## files changed
ops/acceptance/check.mjs
## checks run
- [x] node --test ops/acceptance — pass, captured in CI output
- [ ] app build — not run: no app files changed
## manual QA
Not applicable: command-line evidence kit only.
## verification
CLI output in artifacts/check-output.txt; tests exercised stdin and invalid input.
## risks
Artifact presence does not establish artifact truth.
## manual steps
None for this command-line-only change.
## safe to merge?
- [x] yes
- [ ] no
- [ ] yes after manual env/config step
