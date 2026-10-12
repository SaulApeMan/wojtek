# Contributor instructions

## Communication

Always reply to Saul in English unless he explicitly asks for another output language.

## Product purpose

Build a local, offline-capable educational tool for an offshore surveyor learning troubleshooting and progressing toward more independent work. This is an independent simulator, not NavAQ or an operational survey tool.

## Accuracy

- Mark synthetic data, fixture values, and simplified behavior clearly.
- Never invent vendor menu paths, equipment defaults, or hydrographic tolerances.
- Link verified domain facts to primary sources; record document/version context.
- Keep inferred teaching designs separate from verified vendor behavior.
- Do not claim the exercises certify competence or authorize operational decisions.
- Assess observable state with deterministic rules. Explain precisely what was checked.
- A future AI tutor must distinguish supported answers from uncertainty and must not silently replace the grading rules.

## Implementation

- Preserve local use without internet, API keys, or external assets.
- Prefer small modules and minimal dependencies.
- Keep scenario logic separately testable from rendering.
- Distinguish draft form values from applied simulator state.
- Preserve accessible labels, keyboard operation, readable contrast, and responsive layout.
- Handle missing or invalid browser storage without breaking the exercise.
- Test meaningful grading boundaries and regressions. Run `npm test` before handing off a functional change.
- Explain how to start and extend the app in README.md.
- Do not commit secrets, private source books, client data, or generated temporary artifacts.

## Team workflow

Parallel coding/research/review is permitted when requested by Saul. Assign non-overlapping file ownership and have the coordinating agent integrate and verify the result. Do not assume agents appear as separate user chats.

## Keep the handover current

When changing behavior, update the affected README, architecture, handover, and source notes in the same change. Read docs/HANDOVER.md before starting a new development session. Each new scenario needs a documented source/version, initial fault, observable evidence, allowed actions, assessment criteria, and limitations. The Markdown guides must be committed so a fresh clone is understandable without chat history.
