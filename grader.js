/** The fictional upstream transmitter is fixed for this one exercise. */
export const EXPECTED_SETTINGS = Object.freeze({ protocol: 'UDP', port: 5001, message: 'GGA' });
export const INITIAL_SETTINGS = Object.freeze({ protocol: 'UDP', port: 5002, message: 'GGA' });
export const DIAGNOSES = Object.freeze([
  { value: '', label: 'Choose the cause you found' },
  { value: 'port-mismatch', label: 'Destination and listening ports do not match' },
  { value: 'protocol-mismatch', label: 'Transmitter and listener use different protocols' },
  { value: 'message-mismatch', label: 'The listener expects a different message type' },
  { value: 'transmitter-offline', label: 'The upstream transmitter is switched off' },
]);

export function validateSettings(settings) {
  const errors = {};
  const value = settings && typeof settings === 'object' ? settings : {};
  if (!['UDP', 'TCP'].includes(value.protocol)) errors.protocol = 'Choose UDP or TCP.';
  const portText = typeof value.port === 'string' ? value.port : String(value.port ?? '');
  if (!/^\d{1,5}$/.test(portText) || !Number.isInteger(Number(portText)) || Number(portText) < 1 || Number(portText) > 65535) {
    errors.port = 'Enter a whole-number port from 1 to 65535.';
  }
  if (!['GGA', 'RMC'].includes(value.message)) errors.message = 'Choose GGA or RMC.';
  return { valid: Object.keys(errors).length === 0, errors, settings: Object.keys(errors).length ? null : { protocol: value.protocol, port: Number(portText), message: value.message } };
}

export function settingsKey(settings) {
  const validation = validateSettings(settings);
  return validation.valid ? `${validation.settings.protocol}:${validation.settings.port}:${validation.settings.message}` : null;
}

export function matchesSource(settings) {
  const key = settingsKey(settings);
  return key !== null && key === settingsKey(EXPECTED_SETTINGS);
}

/** A transparent, deterministic rubric. It never evaluates prose or invokes AI. */
export function gradeExercise({ appliedSettings, draftSettings, telemetry, diagnosis } = {}) {
  const appliedKey = settingsKey(appliedSettings);
  const draftsApplied = appliedKey !== null && appliedKey === settingsKey(draftSettings);
  const configured = matchesSource(appliedSettings) && draftsApplied;
  const receiving = configured && telemetry?.receiving === true && Number.isInteger(telemetry?.received) && telemetry.received > 0 && telemetry.settingsKey === appliedKey;
  const identified = diagnosis === 'port-mismatch';
  const checks = [
    { id: 'configuration', passed: configured, label: 'Apply the source-compatible listener', detail: configured ? 'UDP · port 5001 · GGA are applied.' : !draftsApplied ? 'Apply your draft settings before checking the exercise.' : 'Compare the applied protocol, port, and message with the setup sheet.' },
    { id: 'data', passed: receiving, label: 'Verify incoming simulated position data', detail: receiving ? `${telemetry.received} simulated message${telemetry.received === 1 ? '' : 's'} received using the applied listener.` : 'The listener must receive at least one simulated message with the applied settings. Resume the source if paused.' },
    { id: 'diagnosis', passed: identified, label: 'Identify the original fault', detail: identified ? 'The original destination and listening ports did not match.' : 'Select the cause of the original fault, using the initial listener and setup sheet as evidence.' },
  ];
  const passed = checks.filter((check) => check.passed).length;
  return { complete: passed === checks.length, passed, total: checks.length, checks };
}
