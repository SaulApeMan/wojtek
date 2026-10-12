# Survey Lab

An independent, local training starter for offshore survey troubleshooting, inspired by the learning needs of a NavAQ operator. It is not a BeamworX product or a replica of NavAQ.

## Run locally

Install a supported Node.js LTS release, then run:

```sh
git clone https://github.com/SaulApeMan/wojtek.git
cd wojtek
npm start
```

Open http://127.0.0.1:4173 in your browser. Run automated checks with `npm test`.

There are no package dependencies, API keys, accounts, or external assets. The starter runs locally without internet once downloaded. Browser storage is local to the browser and origin; it is not a cloud account.

Use one tab per exercise; concurrent edits to the same exercise are not synchronized.

## First exercise

Investigate a missing positioning feed. Compare the simulated receiver configuration with a fictional setup sheet, correct the mismatch, apply the change, verify data reception, and submit a diagnosis. Progressive hints and deterministic feedback support the exercise.

The scenario's ports, message selection, traffic, vessel motion, and setup sheet are training fixtures. They are not NavAQ defaults, real equipment instructions, or validated hydrographic calculations. The receiver is simulated; this app opens no sensor network connections.

The starter uses a rule-based tutor, not a connected AI model. This makes the assessed criteria inspectable and usable offline. A future AI tutor can explain evidence and cite reviewed references while the rule engine continues checking measurable outcomes.

## Second exercise

Open **02 · Towfish navigation** in the toolbar, or visit `/sonar.html`. Trace a missing feed through a synthetic source solution, NavAQ output, and the sonar topside receiver. Inspect each stage, correct the output destination, and verify both packet receipt and a complete navigation bundle from the correct source.

The interface sheet uses fictional addresses and settings. It is based on the learner's reported workflow, not his actual vessel configuration. See [docs/exercise-02.md](docs/exercise-02.md) for the scenario contract and assessment boundaries. Each exercise has separate browser progress; the second exercise requires fresh telemetry and a new assessment after reload.

## Continue with Codex

Open this repository in Codex and read `AGENTS.md`. Start by running the app and tests. Keep both complete exercises working as new scenarios are introduced.

Useful next inputs from the surveyor:

- The exact NavAQ version and the tasks he performs onboard.
- Shareable screenshots and manuals for that version.
- Three recurring faults, their symptoms, diagnosis steps, and verified resolutions.
- A review of the starter's terminology and answer criteria.

Keep personal books, proprietary manuals, client survey data, screenshots containing project information, and secrets outside the shared repository. Add bibliographic references and original teaching notes to the shared knowledge library.

## Development priorities

1. Validate both exercises with the surveyor and document corrections.
2. Add reviewed scenario definitions and source references.
3. Extend training to configuration checks, data quality diagnosis, and handover reasoning.
4. Add optional source-grounded AI tutoring with an explicit online mode.
5. Consider real-application evidence review only once supported export formats and version-specific workflows are understood.

See `docs/research-notes.md` for source-grounded domain notes as the research is completed.

## Knowledge library

`Downloads/README.md` indexes public documentation and project examples collected for personal study. Original downloaded publications live in `Downloads/raw/`, which is excluded from Git. A fresh clone contains the source index; use its links to obtain the originals locally. Our original research notes remain in `docs/research-notes.md`.

## Handover documentation

Start at [docs/HANDOVER.md](docs/HANDOVER.md) for the reading order, established decisions, missing domain inputs, and a suggested prompt for continuing development with Codex. Keep these guides updated alongside code changes.

## MBES context

Read [docs/mbes-primer.md](docs/mbes-primer.md) for an introduction to multibeam echosounders, their relationship to NavAQ, and proposed later exercises. The current starter simulates positioning-feed and sonar-navigation-output dependencies, not multibeam acoustics or bathymetric processing.

## Verification

See [docs/verification.md](docs/verification.md) for automated checks, the browser verification scope, and a manual acceptance checklist.

## Learner equipment context

[docs/equipment-profile.md](docs/equipment-profile.md) records the learner's reported Voxometer, EdgeTech 4205, Innomar/SESWIN, magnetometer, HiPAP, Veripos, Hydrins, Seapath and K-Sync setup. It separates reported vessel connections from manufacturer-verified capabilities and identifies the next information needed for realistic exercises.

The follow-up [vessel workflow](docs/vessel-workflow.md) documents reported topside computers, data paths, sonar navigation outputs, towing geometry, and a suspected interference incident, with explicit questions for the learner.

## Visual reference

The starter uses a light desktop-style workspace with compact, bordered survey panels inspired by public NavAQ images. See [docs/interface-reference.md](docs/interface-reference.md) for sources, design choices, and limits of the resemblance. The windows are responsive panels, not draggable docks.
