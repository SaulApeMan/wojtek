# Verification record

Date: 2026-10-12.

- `npm test`: 10 tests passed, covering grading boundaries, the HTTP request handler, and a real loopback connection.
- `node --check app.js`: passed.
- HTTP request to the running starter at `http://127.0.0.1:4173`: returned 200.
- Grading tests cover initial failure, correct completion, unapplied drafts, wrong protocol/message, invalid fields, stale or mismatched receipt evidence, and wrong diagnosis.
- Handler checks cover application assets and refusal to serve non-app files. A separate socket-based integration test verifies a real HTTP response.

The environment's sandbox disallows loopback client sockets. All ten final tests passed with approved local-network access. The live preview also returned HTTP 200. Restricted environments may require local-network permission for the integration test.

## Browser verification update

The browser preview now opens successfully. The desktop initial layout was inspected and the map-warning text selector corrected. After adding the light NavAQ-inspired appearance, the desktop layout and a 390px viewport were visually checked; the narrow view had no horizontal page overflow and retained a single hints control.

The browser exercise flow was also checked: initial assessment fails with 0/3, applying UDP/5001/GGA restores incoming data, the correct diagnosis completes all three criteria, refresh preserves completion, and reset restores UDP/5002/GGA with cleared progress. This is a focused smoke check, not comprehensive browser or accessibility coverage.

The initial preview problem was an environment restriction, resolved by running the loopback server with approved local-network access. No browser security setting was changed.

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
