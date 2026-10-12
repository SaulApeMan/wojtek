# Verification record

Date: 2026-10-12.

- `npm test`: 10 tests passed, covering grading boundaries, the HTTP request handler, and a real loopback connection.
- `node --check app.js`: passed.
- HTTP request to the running starter at `http://127.0.0.1:4173`: returned 200.
- Grading tests cover initial failure, correct completion, unapplied drafts, wrong protocol/message, invalid fields, stale or mismatched receipt evidence, and wrong diagnosis.
- Handler checks cover application assets and refusal to serve non-app files. A separate socket-based integration test verifies a real HTTP response.

The environment's sandbox disallows loopback client sockets. All ten final tests passed with approved local-network access. The live preview also returned HTTP 200. Restricted environments may require local-network permission for the integration test.

Follow-up: the browser preview now opens successfully. The desktop initial layout was visually inspected, and a map-warning text selector defect was corrected and verified by reloading. Full exercise interaction and responsive layout have **not** been verified end to end. The first preview attempt timed out while the server ran inside the sandbox. After moving the server to an approved local process, HTTP worked, but browser policy blocked access to the failed preview tab. No alternative browser-control route was used.

## First manual acceptance pass

1. Start the app with `npm start` and open the printed address.
2. Check the initial scenario: UDP / 5002 / GGA, missing data, incomplete assessment.
3. Reveal a hint and mark the source sheet reviewed.
4. Try an invalid port; verify the error and unchanged applied listener.
5. Enter 5001 without applying; checking must not complete the exercise.
6. Apply UDP / 5001 / GGA. Wait for received messages and a track.
7. Choose an incorrect diagnosis and check: completion must fail.
8. Choose the original port mismatch and check: all three criteria should pass.
9. Reload and confirm saved notes, settings, hints, and achieved completion remain coherent.
10. Pause/resume the source, change settings, and check that current feedback follows the new state.
11. Reset through the confirmation dialog: initial settings, notes, hints, track, and completion should reset.
12. Check keyboard-only use and a narrow window, especially the mission/hint controls.

Record observed defects and update this document after the first browser acceptance pass.
