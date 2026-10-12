import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIO, validateOutput, outputKey, createTelemetry, advanceTelemetry, gradeSonarExercise } from '../sonar-model.js';

const expected = SCENARIO.expectedSettings;
const run = (settings = expected) => advanceTelemetry(createTelemetry(), settings, true);
const grade = (settings = expected, overrides = {}) => gradeSonarExercise({ appliedSettings: settings, draftSettings: settings, telemetry: run(settings), diagnosis: 'wrong-destination', inspections: ['source', 'output', 'receiver'], ...overrides });
const check = (result, id) => result.checks.find((item) => item.id === id).passed;

test('wrong initial destination has live upstream and output, but no receiver navigation', () => {
  const t = run(SCENARIO.initialSettings);
  assert.equal(t.sourceCount, 1);
  assert.equal(t.outputCount, 1);
  assert.equal(t.sourceIdentity, 'towfish');
  assert.equal(t.receiverCount, 0);
  assert.equal(t.validCount, 0);
  assert.equal(t.receiverAge, null);
  assert.equal(grade(SCENARIO.initialSettings).complete, false);
});

test('fresh expected output with inspection and diagnosis completes five checks', () => {
  assert.equal(grade().complete, true);
  assert.equal(grade().passed, 5);
  assert.equal(grade(expected, { inspections: new Set(['source', 'output', 'receiver']) }).complete, true);
  assert.equal(grade(expected, { diagnosis: 'source-missing' }).complete, false);
  assert.equal(grade(expected, { inspections: ['source', 'output'] }).complete, false);
});

test('correct draft does not replace the faulty applied output; unapplied edits block pass', () => {
  assert.equal(check(grade(SCENARIO.initialSettings, { draftSettings: expected }), 'configuration'), false);
  const pending = grade(expected, { draftSettings: { ...expected, port: 6002 } });
  assert.equal(pending.complete, false);
  assert.equal(check(pending, 'transport'), false);
});

test('disabled output retains upstream evidence, while pause ages existing evidence', () => {
  const disabled = run({ ...expected, enabled: false });
  assert.equal(disabled.sourceFresh, true);
  assert.equal(disabled.outputCount, 0);
  assert.equal(disabled.receiverCount, 0);
  const paused = advanceTelemetry(run(), expected, false);
  assert.equal(paused.sourceCount, 1);
  assert.equal(paused.receiverCount, 1);
  assert.equal(paused.sourceAge, 1);
  assert.equal(paused.receiverAge, 1);
  assert.equal(paused.navigationFresh, false);
  assert.equal(grade(expected, { telemetry: paused }).complete, false);
});

test('wrong protocol or port still produces local output but cannot reach receiver', () => {
  for (const settings of [{ ...expected, protocol: 'TCP' }, { ...expected, port: 6002 }]) {
    const t = run(settings);
    assert.equal(t.outputFresh, true);
    assert.equal(t.receiverFresh, false);
    assert.equal(t.validCount, 0);
    assert.equal(check(grade(settings), 'transport'), false);
  }
});

test('packet transport is distinct from full valid navigation and source provenance', () => {
  for (const settings of [{ ...expected, messages: ['GGA'] }, { ...expected, positionSource: 'vessel' }]) {
    const t = run(settings);
    assert.equal(t.receiverFresh, true);
    assert.equal(t.receiverCount, 1);
    assert.equal(t.navigationFresh, false);
    assert.equal(t.validCount, 0);
    assert.equal(check(grade(settings), 'transport'), true);
    assert.equal(check(grade(settings), 'navigation'), false);
    assert.equal(grade(settings).complete, false);
  }
});

test('an empty message bundle generates no output or receiver traffic', () => {
  const settings = { ...expected, messages: [] };
  const t = run(settings);
  assert.equal(t.sourceFresh, true);
  assert.equal(t.sourceCount, 1);
  assert.equal(t.outputFresh, false);
  assert.equal(t.outputCount, 0);
  assert.equal(t.receiverFresh, false);
  assert.equal(t.receiverCount, 0);
  assert.equal(t.validCount, 0);
  assert.equal(check(grade(settings), 'transport'), false);
});

test('settings changes reset downstream evidence, retain source evidence and bind current key', () => {
  const before = advanceTelemetry(run(), expected, true);
  const after = advanceTelemetry(before, SCENARIO.initialSettings, true);
  assert.equal(before.receiverCount, 2);
  assert.equal(after.sourceCount, 3);
  assert.equal(after.outputCount, 1);
  assert.equal(after.receiverCount, 0);
  assert.equal(after.validCount, 0);
  assert.equal(after.navAge, null);
  assert.equal(after.settingsKey, outputKey(SCENARIO.initialSettings));
  assert.equal(grade(expected, { telemetry: { ...before, settingsKey: after.settingsKey } }).complete, false);
  assert.equal(grade(expected, { telemetry: { ...before, positionSource: 'vessel' } }).complete, false);
});

test('reset telemetry has no receipt evidence and cannot complete', () => {
  const reset = createTelemetry();
  assert.equal(reset.ticks, 0);
  assert.equal(reset.receiverCount, 0);
  assert.equal(reset.settingsKey, null);
  assert.equal(reset.sourceAge, null);
  assert.equal(grade(expected, { telemetry: reset }).complete, false);
});

test('validation canonicalizes message order and rejects malformed configuration', () => {
  assert.equal(outputKey({ ...expected, port: '6001', messages: [...expected.messages].reverse() }), outputKey(expected));
  for (const destination of ['', '192.0.2', '256.0.2.24', '192.00.2.24', '192.0.2.-1', '192.0.2.24 ']) assert.equal(validateOutput({ ...expected, destination }).valid, false);
  for (const port of ['', ' ', null, false, 0, 65536, 1.5, '6e3', '6001.0']) assert.equal(validateOutput({ ...expected, port }).valid, false);
  for (const messages of [null, 'GGA', ['GGA', 'GGA'], ['XYZ']]) assert.equal(validateOutput({ ...expected, messages }).valid, false);
  assert.equal(validateOutput({ ...expected, messages: [] }).valid, true);
  assert.equal(validateOutput({ ...expected, enabled: 'true' }).valid, false);
});

test('malformed state is safe, cannot fabricate pass and yields nonnegative counters', () => {
  for (const malformed of [null, undefined, false, 'bad', [], {}, { sourceCount: -1, receiverCount: Infinity, ticks: NaN }]) {
    assert.doesNotThrow(() => advanceTelemetry(malformed, null, true));
    assert.equal(grade(expected, { telemetry: malformed }).complete, false);
    assert.equal(gradeSonarExercise(malformed).complete, false);
    const t = advanceTelemetry(malformed, null, true);
    assert.equal(t.sourceCount, 1);
    assert.equal(t.receiverCount, 0);
  }
});
