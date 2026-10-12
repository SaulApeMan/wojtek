# Exercise 02: trace the towfish navigation feed

Scenario ID: `sonar-feed`, version 1. Added 2026-10-12.

## Evidence and scope

The learner reported navigation data leaving the NavAQ Online PC for the towed side-scan sonar system, naming GGA, ZDA, VTG and HDT. He did not recall COM ports, IP addresses, or precise connections. See [vessel-workflow.md](vessel-workflow.md) and [equipment-profile.md](equipment-profile.md).

This exercise uses that logical relationship as its teaching context. All addresses, ports, counters, settings, observations and traffic are original fictional fixtures. It is not a reconstruction of a NavAQ dialog or an EdgeTech configuration procedure. The learner has not yet reviewed this scenario.

## Learning objective

Trace a missing feed through three observation points: a source solution, NavAQ output, and the sonar topside input. Distinguish source availability, output activity, packet reception and valid navigation. Identify the original fault and verify recovery at the destination.

## Interface sheet / answer contract

| Item | Fictional requirement |
| --- | --- |
| Sender | NavAQ Online PC, 192.0.2.10 |
| Intended destination | Sonar topside input, 192.0.2.24 |
| Transport | UDP |
| Receiver port | 6001 |
| Output enabled | Yes |
| Position source | Towfish solution, not vessel position |
| Required bundle | GGA, ZDA, VTG, HDT |
| Initial defect | Output destination is 192.0.2.42 instead of 192.0.2.24 |

The four-message bundle is required by this fixture only. It is not asserted to be a universal sonar requirement. No packets leave the browser, and no actual NMEA sentences are decoded. HDT is a supplied synthetic heading component; the learner's reported bearing-to-sheave calculation is not implemented or validated.

## Observable evidence

- **Source solution:** a synthetic towfish solution advances while the source runs.
- **NavAQ output:** output activity may advance despite sending to the wrong destination. The panel shows the applied route and selected source/bundle.
- **Sonar receiver:** packet count advances only for the matching fixture destination, protocol and port. Valid navigation additionally requires the towfish source and complete bundle.

Freshness is evaluated in simulation ticks. Pausing the source stops fresh evidence. Applying a changed configuration resets the downstream observation context; stale counters cannot be reused as evidence for another configuration.

## Allowed learner actions

Inspect each stage; edit and apply the output settings; pause/resume the synthetic source; reveal progressive hints; select the original fault; write optional ungraded notes; check the assessment; reset the exercise.

Draft values do not alter the running output until Apply is used. A reset affects this exercise only. Its browser storage is independent of Exercise 01.

## Assessment criteria

All five criteria are required:

1. Apply the fixture's correct configuration without pending draft differences.
2. Inspect the source, output and receiver evidence panels. This records inspection, not proof of understanding.
3. Observe fresh transport receipt at the intended sonar receiver under the current applied configuration.
4. Observe fresh valid navigation with the required bundle and towfish provenance.
5. Identify the original wrong-destination fault.

The checks are deterministic. They do not grade free prose, certify competence, prove real hydrographic accuracy, or imply sonar readiness for operations.

## Boundary cases for contributors

- A correct destination only in the draft must not fix receipt or pass.
- Output activity while addressed to 192.0.2.42 must not count as sonar receipt.
- Correct transport with vessel position or an incomplete bundle can produce packets but must not produce valid fixture navigation.
- Paused, stale or configuration-mismatched evidence cannot establish current recovery.
- Invalid IP/port/settings must be rejected without applying them.
- Refresh may restore configuration and notes but must not invent fresh telemetry; the learner must obtain fresh observations and recheck.
- Switching exercises must not mix their saved state. Reset must clear only Exercise 02.

## Next domain review

Confirm the real source/destination interfaces, message provenance, which messages the sonar actually consumed, and the heading derivation. Replace fixture-specific assumptions only after recording the supporting evidence and revising the scenario version and tests.
