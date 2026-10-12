# Architecture

## Runtime

Survey Lab is a buildless browser application served by a small Node.js server. `npm start` runs `server.mjs` on `127.0.0.1:4173`. There is no backend database, network sensor receiver, AI service, or dependency installation step.

The local server only serves an explicit allowlist of application files. It does not expose the repository, personal downloads, or Git metadata. Browser requests to external services are not needed.

## File responsibilities

| File | Responsibility |
| --- | --- |
| `index.html` | Accessible application structure and exercise controls |
| `styles.css` | Responsive visual layout and presentation |
| `app.js` | Browser state, synthetic telemetry, events, persistence, and rendering |
| `grader.js` | Fictional fixture settings, input validation, and pure assessment rules |
| `server.mjs` | Loopback static server with a restricted file allowlist |
| `package.json` | Run and test commands |
| `docs/research-notes.md` | Domain grounding and sources |
| `Downloads/README.md` | Public-reference library index |

## Exercise contract

The fictional upstream source emits GGA positioning messages over simulated UDP to destination port 5001. The initial receiving configuration uses UDP and GGA but listens on port 5002. These values belong only to the exercise.

The learner compares a setup sheet with the listener configuration, changes the receiving port, applies the configuration, observes incoming simulated positions, and identifies the original port mismatch. Changing a draft input must not change the running listener until Apply is used.

The grader checks three things:

1. Applied settings match the fixture and there are no unapplied draft differences.
2. The telemetry reports received simulated messages associated with those applied settings.
3. The selected original diagnosis is the port mismatch.

This establishes completion of the fictional scenario only. It does not measure GNSS accuracy, hydrographic uncertainty, real network connectivity, or understanding of an unrestricted written explanation.

## Extension approach

For a second scenario, first extract the scenario-specific configuration, hints, diagnosis options, and criteria into a clearly versioned definition. Keep validation and grading pure and testable; do not bury answers in visual components. Retain an explicit association between applied configuration and its telemetry so stale evidence cannot pass a changed configuration.

If an AI tutor is added, use an explicit online mode and a secure server-side API boundary. Keep API keys out of browser code and source control. The tutor should explain reviewed evidence and cite sources; deterministic checks should remain responsible for observable pass criteria.

Store only local learning state in the browser. Version persistence formats when their meaning changes, validate restored values, and recover from unavailable or malformed storage. Update this guide when responsibilities or data flow change.

The interface includes a local view-navigation toolbar and a light desktop-style CSS layout. On desktop the sensor/reference panes sit beside the chart, with an event log below; controls adapt to available width. See `docs/interface-reference.md` for visual sources and fidelity boundaries.
