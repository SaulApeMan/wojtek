# Research grounding for the training starter

Source access date: **2026-10-12**. This is an independent learning prototype. Its exercises, UI, vessel, sensor states, and network settings are fictional. It is not NavAQ, vendor training, an accredited programme, or a test of occupational competence.

The learner's work includes MBES. See the [MBES primer](mbes-primer.md) for the acquisition/calibration/processing relationship, sensor dependencies, and proposed follow-on exercises.

## Verified facts and source boundaries

| Source | Verified facts relevant to this starter | Limits |
| --- | --- | --- |
| [BeamworX NavAQ product page](https://www.beamworx.com/navaq/) | NavAQ performs navigation and survey acquisition, supports UDP/TCP/serial sensor interfaces and custom ASCII/NMEA drivers, displays real-time results, and logs raw sensor messages separately from results. It includes coordinate conversion and survey planning. | A product page is not a version-specific user manual. It does not establish this prototype's menu paths, default ports, or exact driver behaviour. |
| [Trimble GGA documentation](https://receiverhelp.trimble.com/oem-gnss/nmea0183-messages-gga.html) | GGA carries time, position, fix quality, satellite count, HDOP, and height-related fields. A zero quality indicator denotes an invalid fix. | Receiver-specific descriptions must not silently become universal rules for every receiver. A quality code alone does not prove accuracy. |
| [Trimble NMEA message overview](https://receiverhelp.trimble.com/alloy-gnss/en-us/nmea0183-messages-overview.html) | GGA represents position/fix data; HDT represents true heading; VTG represents track and speed over ground. | Course over ground and vessel heading are distinct. GGA alone cannot supply heading. |
| [IHO standards catalog](https://iho.int/standards-and-specifications) | The catalog lists S-44 edition 6.2.0 (October 2024), and S-5A/S-5B edition 2.0.0 (August 2026). | Verify editions again when lessons are revised. Older search results remain available online. |
| [IHO S-44, adopted edition 6.2.0](https://iho.int/uploads/user/pubs/standards/s-44/S-44_Edition_6.2.0_adopted.pdf) | The standard addresses survey outcomes, positioning uncertainty, coverage, feature detection, metadata, and quality. It explicitly does not provide equipment setup procedures. | Do not use it as a NavAQ configuration manual or assume one survey order suits every contract. |
| [FIG/IHO/ICA S-5B edition 2.0.0](https://iho.int/uploads/user/pubs/standards/s-5/S-5B_ED%202.0.0_FINAL_07OUT26.pdf) | B2 covers data interfaces, integration faults, and networks. E4 covers geodesy and positioning. E5 includes survey operations, quality control, and reporting. | These are educational competence standards, not a definition of a particular employer's senior job title. This starter covers only a tiny portion. |
| [IMCA C004 public description](https://www.imca-int.com/resources/technical-library/document/c95ac45a-c55b-ee11-8def-6045bdd2c3b2/) | IMCA describes a framework of qualifications, experience, and competence criteria for offshore survey roles. The public listing shows revision 3.4, September 2025. | Only the public description was reviewed; no claim is made to have inspected the full competence tables. |

The IHO and IMCA material provides an international foundation relevant to European offshore work. Country, client, employer, vessel, and project requirements still need to be established with the learner. No universal European promotion requirement is asserted here.

## First exercise: restoring a simulated GNSS position feed

The following is a **design recommendation**, not a vendor procedure:

1. Present a stale position warning, the receiving application's configuration, and a fictional sensor handover sheet.
2. Have the learner compare the sender's UDP destination port with the receiving application's local listen port. Keep the fixture's address, protocol, enabled state, and GGA format explicit.
3. Allow the learner to change settings, then apply them. Only the exercise's internally consistent configuration restores its simulated feed.
4. Require an observation step: incoming messages advance, timestamps are fresh, valid positions decode, and the display updates. These are simulated observations, not live hardware measurements.
5. Ask what failed, what changed, what evidence shows recovery, and what remains unverified.

Every port and IP address shown is an exercise fixture, **not a BeamworX default or an instruction for a vessel**. A web-only simulation need not open a UDP socket; describe the transport as simulated if no real packets are exchanged. A deterministic model should grade its own state. An eventual AI tutor can explain outcomes but should not invent success from a learner's prose.

The intended root cause is a receive-port mismatch. Real missing data can also arise from incorrect addressing, interface binding, routing, firewalls, a stopped sender, disabled acquisition, wrong protocol, or decoding errors. Include those as possible real-world alternatives in the debrief without pretending the starter models them all. Successful packet receipt and successful message decoding are separate observations.

Keep any animated vessel heading independent of GGA. If the exercise displays only a synthetic orientation, label it accordingly. If sample NMEA strings are displayed as valid wire-format messages, validate their fields and checksums; otherwise label them illustrative excerpts.

Restoring position reception is the exercise's pass condition. It does not validate the coordinate reference system, timing, lever arms, GNSS performance, full sensor integration, or bathymetric quality. A useful handover explicitly distinguishes restored reception from readiness to resume an actual survey.

## Suggested progression after friend review

These are proposed learning priorities, not copied accreditation criteria:

| Area | Candidate exercise | Evidence of understanding |
| --- | --- | --- |
| Sensor integration | Packets arrive but the chosen message decoder produces no positions | Separates transport, parsing, and measurement validity |
| Time and latency | Position timestamps drift from the acquisition clock | Explains why a moving sensor's timing affects results |
| Geodesy | Plausible-looking coordinates use the wrong project reference system | Identifies the reference frame, units, transformation, and verification point |
| Geometry | Sensor lever-arm sign is wrong | Uses a stated vessel axis convention and checks the effect |
| Survey QC | Overlapping lines disagree | Investigates competing explanations instead of correcting data blindly |
| Acquisition planning | A line plan leaves coverage gaps | Evaluates coverage against a stated project requirement |
| Reporting | A fault spans part of a survey line | Records affected interval, evidence, remedial action, and remaining uncertainty |

For progression toward senior responsibilities, gradually remove hints and require justified decisions, impact assessment, escalation, and clear handovers. Actual readiness must be assessed by the employer and experienced survey personnel through appropriate practical work.

## Friend-validation checklist before adding exact NavAQ lessons

- Confirm the software name, version/build, licence modules, and actual role: online survey, processing, geophysics, construction support, or another specialty.
- Identify three recurrent tasks or faults from experience and their effect on the work.
- Obtain shareable, redacted screenshots or a version-matched manual to establish actual controls and terminology.
- Confirm which equipment outputs which messages, the network topology, timing, and project coordinate conventions.
- Review each exercise's root cause, expected observations, alternative causes, and assessment rubric with an experienced operator.
- Establish the employer's requirements for promotion and the relevant project specifications; do not infer them from the title alone.
- Keep proprietary manuals and operational data outside the public repository unless redistribution is permitted. Link source material and record versions rather than copying whole publications.
- Recheck the sources and lesson assumptions when the supported software version changes.

## Research method

Primary vendor and standards-body pages were inspected using the available web research tool. The installed Firecrawl CLI reported authentication but could not fetch account information, so its network path was not relied on. No confidential vessel data or private manuals were accessed.

## Learner-specific equipment evidence

See [equipment-profile.md](equipment-profile.md) for the equipment account supplied on 2026-10-12. It is a separate evidence layer from manufacturer documentation: product capabilities do not prove the vessel's exact configuration. Use its unresolved details when planning the next exercises.

## Second exercise implementation

The reported NavAQ-to-sonar workflow now has a fictional teaching adaptation described in [exercise-02.md](exercise-02.md). Its IP addresses, UDP port, full-message requirement and grading rules are original exercise design choices, not facts established by the manufacturer sources above.
