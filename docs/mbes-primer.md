# MBES and the NavAQ learning path

Prepared for the learner and future Codex contributors. Primary sources checked **2026-10-12**. This is an original introductory guide, not a vessel procedure or a version-specific NavAQ manual.

## What MBES means

**MBES means multibeam echosounder.** In seabed surveying it measures many soundings across a swath rather than one depth directly under the vessel. Its acoustic observations must be combined with the location and orientation of the sonar and the properties of the water to obtain useful seabed coordinates. The resulting point cloud is bathymetry: measurements of underwater terrain. Backscatter describes the strength of returned sound and serves a different purpose from depth. BeamworX describes NavAQ's multibeam calculations and its 2D, swath, and 3D displays in its [NavAQ product documentation](https://www.beamworx.com/navaq/).

MBES is equipment and a survey method; NavAQ is software in the workflow. Knowing the software's buttons is only one part of collecting dependable measurements.

## Where the BeamworX programs fit

| Program | Role in an MBES workflow | Learning focus |
| --- | --- | --- |
| NavAQ | Interfaces sensor streams, records raw messages and computed results, and presents live survey information. BeamworX lists support for several multibeam manufacturers and integrated arrangements where position and motion accompany sonar data. | Correct inputs, configuration provenance, monitoring, acquisition, and evidence of data quality. |
| AutoPatch | Estimates calibration parameters such as mounting angles and latency from suitable survey data and provides calibration reporting. | Understand the evidence supporting a calibration and verify the outcome. |
| AutoClean | Cleans and validates point clouds; supports manual and automated point handling. Raw multibeam reprocessing is listed as an optional add-on. | Inspect results, investigate systematic problems, preserve evidence, and avoid removing real features. |

Sources: [NavAQ](https://www.beamworx.com/navaq/), [AutoPatch](https://www.beamworx.com/autopatch/), [AutoClean](https://www.beamworx.com/autoclean/). The precise division of work depends on the installed modules and the employer's workflow. Calibration is not simply a mandatory step between every acquisition and processing operation.

## What a seabed sounding depends on

| Input or concept | Question the surveyor needs to answer |
| --- | --- |
| GNSS position | Where was the platform, in which reference system, and with what quality? |
| Heading | Which way was the sonar facing? This differs from direction of travel over ground. |
| Roll, pitch, and heave | How did platform motion change the sonar's orientation and vertical position? |
| Lever arms and mounting angles | How are antenna, motion sensor, sonar, and vessel reference point related geometrically? |
| Sound speed at the head and through the water column | Are beam steering and propagation calculations using appropriate measurements? |
| Time | Do the sonar and auxiliary measurements refer to the same instant? |
| Vertical reference | How are measured positions/depths related to the required project datum? |

R2Sonic's [Multibeam Survey Suite Components](https://www.r2sonic.com/wp-content/uploads/2020/03/Multibeam-Survey-Suite-Components.pdf) explains the roles of positioning, heading, motion sensing, offsets, and sound-velocity measurements. It is a 2017 manufacturer training reference, not universal installation guidance. Modern integrated systems may supply several quantities together; do not assume a separate cable or device for each row.

R2Sonic's [survey accuracy guidance](https://r2sonic.com/control-whats-controllable-top-tips-for-accurate-multibeam-survey/) discusses timing, offsets, calibration, sound speed, and motion-related artefacts. A live stream alone cannot establish that those inputs agree. An apparent seabed pattern may have several possible causes; do not teach a single visual symptom as conclusive diagnosis.

The vertical-reference question and acceptance of results belong to the survey specification. [IHO S-44](https://iho.int/uploads/user/pubs/standards/s-44/S-44_Edition_6.2.0_adopted.pdf) covers positioning uncertainty, coverage, features, and metadata, rather than software setup. The contract's required quality must be established before selecting assessment tolerances.

## How this changes the starter

The current position-feed exercise is a useful prerequisite. It teaches one dependency of an MBES system. It does **not** simulate multibeam acoustic measurements, ray tracing, a patch test, or bathymetric quality control. Its pass means the fictional position feed was restored.

Our proposed next exercises are learning designs, not claims about features already implemented:

1. **Position is healthy; motion is stale.** Give the learner independently timestamped simulated position, heading, and attitude streams. Require identification of the stale dependency, a justified action, and a handover describing the affected interval. Assessment checks the actual simulated states and evidence inspected.
2. **Two lines disagree across the swath.** Provide a synthetic comparison and several hypotheses, including sound-speed and alignment problems. Reward selecting the next discriminating check and explaining remaining uncertainty. Do not let a learner pass merely by choosing a familiar-looking artefact name.
3. **The configuration changed after calibration.** Supply a fictional configuration history, offset convention, and calibration report. Ask the learner to identify which change invalidates an assumption and propose a reviewed verification plan. Grade against the scenario's stated geometry, not invented real-vessel values.

Each later scenario needs a stated physical model, source references, known limitations, and review by an experienced surveyor. An AI tutor may explain the evidence; it should not manufacture hardware-specific settings or certify field competence.

## Questions for the friend before detailed lessons

- Which MBES manufacturer/model, number of heads, and mounting arrangement are used?
- Which NavAQ version/build and BeamworX modules are installed?
- Is his responsibility live acquisition, processing, calibration, or several of these?
- Which GNSS/INS or motion/heading systems supply the data, and where are they integrated?
- How are sound-speed observations, time synchronisation, and calibration records handled in the actual workflow?
- Which horizontal and vertical references and quality specifications apply?
- What mistakes or faults does he repeatedly need to diagnose, and what shareable evidence can illustrate them?

Record answers alongside each lesson. Until they are known, teach general principles and clearly fictional settings. See also [research notes](research-notes.md) and the [local source index](../Downloads/README.md).
