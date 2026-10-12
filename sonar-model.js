// All addresses, ports, message requirements and timing below are teaching fixtures.
// This module does not open network connections or represent a vendor decoder.
const MESSAGES = Object.freeze(['GGA', 'ZDA', 'VTG', 'HDT']);
const expectedSettings = Object.freeze({ enabled: true, protocol: 'UDP', destination: '192.0.2.24', port: 6001, positionSource: 'towfish', messages: MESSAGES });
export const SCENARIO = Object.freeze({
  id: 'sonar-feed', version: 1,
  senderAddress: '192.0.2.10', receiverAddress: '192.0.2.24',
  expectedSettings,
  initialSettings: Object.freeze({ ...expectedSettings, destination: '192.0.2.42' }),
  diagnoses: Object.freeze([
    { value: '', label: 'Choose the original fault' },
    { value: 'wrong-destination', label: 'Output destination does not match the sonar topside address' },
    { value: 'source-missing', label: 'The upstream towfish position source is missing' },
    { value: 'output-disabled', label: 'Navigation output is disabled' },
    { value: 'wrong-source', label: 'Vessel position was selected instead of towfish position' },
  ]),
  hints: Object.freeze([
    'Inspect the upstream source, local navigation output and sonar receiver separately. Local output does not prove downstream receipt.',
    'Compare the output destination with the fictional sonar topside address on the setup sheet.',
    'Change destination 192.0.2.42 to 192.0.2.24, apply, and verify fresh receiver packets and valid towfish navigation. Keep UDP port 6001 and the full fixture message bundle.',
  ]),
});

export function validateOutput(settings) {
  const value = settings && typeof settings === 'object' ? settings : {};
  const errors = {};
  if (typeof value.enabled !== 'boolean') errors.enabled = 'Choose whether output is enabled.';
  if (!['UDP', 'TCP'].includes(value.protocol)) errors.protocol = 'Choose UDP or TCP.';
  const destination = typeof value.destination === 'string' ? value.destination : '';
  const octets = destination.split('.');
  if (octets.length !== 4 || !octets.every((part) => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255)) errors.destination = 'Enter an IPv4 address using four decimal octets (0–255).';
  const port = typeof value.port === 'string' || typeof value.port === 'number' ? String(value.port) : '';
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) errors.port = 'Enter a whole-number port from 1 to 65535.';
  if (!['towfish', 'vessel'].includes(value.positionSource)) errors.positionSource = 'Choose towfish or vessel position.';
  if (!Array.isArray(value.messages) || value.messages.some((message) => !MESSAGES.includes(message)) || new Set(value.messages).size !== value.messages.length) errors.messages = 'Choose a unique subset of GGA, ZDA, VTG and HDT.';
  const valid = Object.keys(errors).length === 0;
  return { valid, errors, settings: valid ? { enabled: value.enabled, protocol: value.protocol, destination, port: Number(port), positionSource: value.positionSource, messages: MESSAGES.filter((message) => value.messages.includes(message)) } : null };
}

export function outputKey(settings) {
  const validation = validateOutput(settings);
  return validation.valid ? JSON.stringify(validation.settings) : null;
}

export function createTelemetry() {
  return { ticks: 0, sourceCount: 0, outputCount: 0, receiverCount: 0, validCount: 0, sourceFresh: false, outputFresh: false, receiverFresh: false, navigationFresh: false, sourceAge: null, outputAge: null, receiverAge: null, navAge: null, settingsKey: null, sourceIdentity: 'towfish', positionSource: null };
}

const count = (value) => Number.isSafeInteger(value) && value >= 0 ? value : 0;
const increment = (value) => Math.min(count(value) + 1, Number.MAX_SAFE_INTEGER);
const age = (value) => Number.isSafeInteger(value) && value >= 0 ? increment(value) : null;

export function advanceTelemetry(telemetry, appliedSettings, sourceRunning) {
  const previous = telemetry && typeof telemetry === 'object' ? telemetry : createTelemetry();
  const validation = validateOutput(appliedSettings);
  const key = outputKey(appliedSettings);
  const changed = key === null || previous.settingsKey !== key;
  const settings = validation.settings;
  const sourceFresh = sourceRunning === true;
  const outputFresh = sourceFresh && validation.valid && settings.enabled && settings.messages.length > 0;
  const receiverFresh = outputFresh && settings.protocol === expectedSettings.protocol && settings.destination === expectedSettings.destination && settings.port === expectedSettings.port;
  const navigationFresh = receiverFresh && settings.positionSource === 'towfish' && MESSAGES.every((message) => settings.messages.includes(message));
  return {
    ticks: increment(previous.ticks),
    sourceCount: sourceFresh ? increment(previous.sourceCount) : count(previous.sourceCount),
    outputCount: outputFresh ? increment(changed ? 0 : previous.outputCount) : changed ? 0 : count(previous.outputCount),
    receiverCount: receiverFresh ? increment(changed ? 0 : previous.receiverCount) : changed ? 0 : count(previous.receiverCount),
    validCount: navigationFresh ? increment(changed ? 0 : previous.validCount) : changed ? 0 : count(previous.validCount),
    sourceFresh, outputFresh, receiverFresh, navigationFresh,
    sourceAge: sourceFresh ? 0 : age(previous.sourceAge),
    outputAge: outputFresh ? 0 : changed ? null : age(previous.outputAge),
    receiverAge: receiverFresh ? 0 : changed ? null : age(previous.receiverAge),
    navAge: navigationFresh ? 0 : changed ? null : age(previous.navAge),
    settingsKey: key, sourceIdentity: 'towfish', positionSource: validation.valid ? settings.positionSource : null,
  };
}

export function gradeSonarExercise(input = {}) {
  const { appliedSettings, draftSettings, telemetry, diagnosis, inspections } = input && typeof input === 'object' ? input : {};
  const key = outputKey(appliedSettings);
  const draftsApplied = key !== null && key === outputKey(draftSettings);
  const configured = draftsApplied && key === outputKey(expectedSettings);
  const inspected = Array.isArray(inspections) || inspections instanceof Set ? new Set(inspections) : new Set();
  const evidence = telemetry && typeof telemetry === 'object' ? telemetry : {};
  const applied = validateOutput(appliedSettings).settings;
  const transportCompatible = applied?.enabled === true && applied.protocol === 'UDP' && applied.destination === expectedSettings.destination && applied.port === expectedSettings.port;
  const current = draftsApplied && transportCompatible && evidence.settingsKey === key;
  const transport = current && evidence.outputFresh === true && evidence.receiverFresh === true && count(evidence.outputCount) > 0 && count(evidence.receiverCount) > 0 && evidence.outputAge === 0 && evidence.receiverAge === 0;
  const navigation = configured && transport && evidence.sourceFresh === true && evidence.navigationFresh === true && count(evidence.sourceCount) > 0 && count(evidence.validCount) > 0 && evidence.sourceAge === 0 && evidence.navAge === 0 && evidence.sourceIdentity === 'towfish' && evidence.positionSource === 'towfish';
  const checks = [
    { id: 'configuration', label: 'Apply the fixture navigation output', passed: configured, detail: configured ? 'The applied output matches the fictional setup sheet.' : !draftsApplied ? 'Apply the current draft before checking.' : 'Compare enabled output, destination, transport, port, position source and message bundle with the setup sheet.' },
    { id: 'inspections', label: 'Inspect the three evidence stages', passed: ['source', 'output', 'receiver'].every((stage) => inspected.has(stage)), detail: 'Open source, output and receiver evidence. This records inspection only; it does not assess comprehension.' },
    { id: 'transport', label: 'Verify fresh downstream transport receipt', passed: transport, detail: transport ? 'The sonar receiver has fresh packets from the currently applied output.' : 'Apply matching destination, protocol and port with output enabled, then verify fresh local output and receiver packets.' },
    { id: 'navigation', label: 'Verify valid towfish navigation', passed: navigation, detail: navigation ? 'Fresh upstream towfish evidence and the complete fictional navigation bundle are present at the receiver.' : 'Verify fresh towfish provenance and the full fixture message bundle. Packet receipt alone is insufficient.' },
    { id: 'diagnosis', label: 'Identify the original fault', passed: diagnosis === 'wrong-destination', detail: diagnosis === 'wrong-destination' ? 'The original destination 192.0.2.42 did not match sonar topside 192.0.2.24.' : 'Use the original output and receiver setup to identify the starting fault.' },
  ];
  const passed = checks.filter((check) => check.passed).length;
  return { complete: passed === checks.length, passed, total: checks.length, checks };
}
