import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPECTED_SETTINGS, INITIAL_SETTINGS, validateSettings, matchesSource, settingsKey, gradeExercise } from '../grader.js';

function workingState(overrides = {}) {
  return {
    appliedSettings: { ...EXPECTED_SETTINGS },
    draftSettings: { ...EXPECTED_SETTINGS },
    telemetry: { receiving: true, received: 2, settingsKey: settingsKey(EXPECTED_SETTINGS) },
    diagnosis: 'port-mismatch',
    ...overrides,
  };
}

test('the initial port mismatch cannot pass even with a claimed incoming packet', () => {
  const result = gradeExercise(workingState({ appliedSettings: INITIAL_SETTINGS, draftSettings: INITIAL_SETTINGS }));
  assert.equal(result.complete, false);
  assert.equal(result.checks[0].passed, false);
  assert.equal(result.checks[1].passed, false);
});

test('valid applied configuration, received data and diagnosis complete the exercise', () => {
  const result = gradeExercise(workingState());
  assert.equal(result.complete, true);
  assert.equal(result.passed, 3);
});

test('correct draft edits cannot substitute for the applied listener', () => {
  const result = gradeExercise(workingState({ appliedSettings: INITIAL_SETTINGS }));
  assert.equal(result.complete, false);
  assert.equal(result.checks[0].passed, false);
  assert.match(result.checks[0].detail, /Apply your draft/);
});

test('pending draft changes prevent a misleading completion', () => {
  const result = gradeExercise(workingState({ draftSettings: { ...EXPECTED_SETTINGS, protocol: 'TCP' } }));
  assert.equal(result.checks[0].passed, false);
});

test('wrong protocol and message do not receive or pass', () => {
  for (const wrong of [{ ...EXPECTED_SETTINGS, protocol: 'TCP' }, { ...EXPECTED_SETTINGS, message: 'RMC' }]) {
    assert.equal(matchesSource(wrong), false);
    const result = gradeExercise(workingState({ appliedSettings: wrong, draftSettings: wrong }));
    assert.equal(result.checks[0].passed, false);
    assert.equal(result.checks[1].passed, false);
  }
});

test('invalid ports and missing or unsupported fields are rejected', () => {
  for (const port of ['', ' ', '5001.0', '5e3', '0', '-1', '65536', 'abc', null, undefined, NaN, Infinity, 5.5]) {
    assert.equal(validateSettings({ ...EXPECTED_SETTINGS, port }).valid, false, `Port ${String(port)}`);
  }
  for (const port of ['1', 5001, '5001', 65535]) assert.equal(validateSettings({ ...EXPECTED_SETTINGS, port }).valid, true);
  for (const invalid of [null, {}, { ...EXPECTED_SETTINGS, protocol: 'udp' }, { ...EXPECTED_SETTINGS, message: 'XYZ' }]) {
    assert.equal(validateSettings(invalid).valid, false);
    assert.equal(matchesSource(invalid), false);
  }
});

test('data must be live and belong to the current listener settings', () => {
  for (const telemetry of [
    { receiving: false, received: 3, settingsKey: settingsKey(EXPECTED_SETTINGS) },
    { receiving: true, received: 0, settingsKey: settingsKey(EXPECTED_SETTINGS) },
    { receiving: true, received: -1, settingsKey: settingsKey(EXPECTED_SETTINGS) },
    { receiving: true, received: 1.5, settingsKey: settingsKey(EXPECTED_SETTINGS) },
    { receiving: true, received: 3, settingsKey: settingsKey(INITIAL_SETTINGS) },
    null,
  ]) assert.equal(gradeExercise(workingState({ telemetry })).checks[1].passed, false);
});

test('the original fault must be identified; free text is not pretended to be AI-graded', () => {
  for (const diagnosis of ['', 'protocol-mismatch', 'message-mismatch', 'transmitter-offline', 'some prose']) {
    assert.equal(gradeExercise(workingState({ diagnosis })).complete, false);
  }
  assert.equal(gradeExercise().complete, false);
});
