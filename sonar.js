import { SCENARIO, validateOutput, outputKey, createTelemetry, advanceTelemetry, gradeSonarExercise } from './sonar-model.js';

const STORAGE_KEY = 'survey-lab.sonar-feed.v1';
const $ = (id) => document.getElementById(id);
let notice = '';
let storageFailed = false;
let formErrors = {};
let toastTimer;

function copySettings(settings, draft = false) {
  return { ...settings, port: draft ? String(settings.port) : settings.port, messages: [...settings.messages] };
}

function freshState() {
  return {
    version: SCENARIO.version,
    appliedSettings: copySettings(SCENARIO.initialSettings),
    draftSettings: copySettings(SCENARIO.initialSettings, true),
    telemetry: createTelemetry(), sourceRunning: true, inspections: [], hints: 0,
    diagnosis: '', notes: '', completed: false, lastCheck: null,
    events: [{ time: 0, text: 'Exercise started. Fictional source and navigation output are enabled.', type: 'info' }, { time: 0, text: 'Output destination is 192.0.2.42. The sonar receiver endpoint is fixed at 192.0.2.24.', type: 'warning' }],
  };
}

function safeDraft(value) {
  if (!value || typeof value.destination !== 'string' || typeof value.port !== 'string' || typeof value.enabled !== 'boolean' || !['UDP', 'TCP'].includes(value.protocol) || !['towfish', 'vessel'].includes(value.positionSource) || !Array.isArray(value.messages) || value.messages.some((message) => !SCENARIO.expectedSettings.messages.includes(message)) || new Set(value.messages).size !== value.messages.length) throw new Error('Invalid saved exercise');
  return { enabled: value.enabled, protocol: value.protocol, destination: value.destination.slice(0, 64), port: value.port.slice(0, 16), positionSource: value.positionSource, messages: [...value.messages] };
}

function restoreState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return freshState();
    const raw = JSON.parse(saved);
    if (!raw || raw.version !== SCENARIO.version || !validateOutput(raw.appliedSettings).valid) throw new Error('Invalid saved exercise');
    const restored = {
      ...freshState(),
      appliedSettings: validateOutput(raw.appliedSettings).settings,
      draftSettings: safeDraft(raw.draftSettings),
      sourceRunning: raw.sourceRunning !== false,
      inspections: Array.isArray(raw.inspections) ? [...new Set(raw.inspections.filter((stage) => ['source', 'output', 'receiver'].includes(stage)))] : [],
      hints: Number.isInteger(raw.hints) && raw.hints >= 0 && raw.hints <= SCENARIO.hints.length ? raw.hints : 0,
      diagnosis: SCENARIO.diagnoses.some((item) => item.value === raw.diagnosis) ? raw.diagnosis : '',
      notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 1200) : '',
    };
    // Settings and learner work persist; current packet evidence must be observed afresh.
    restored.events = [{ time: 0, text: 'Saved settings and learner work restored. Live evidence counters cleared for this session; verify and check again.', type: 'info' }];
    notice = raw.completed === true ? 'Your previous completion was saved. Settings and notes are restored; run the source and check again to verify fresh evidence in this session.' : 'Saved exercise restored. Live evidence starts fresh; resume the source if paused and verify the three stages again.';
    return restored;
  } catch (error) {
    if (error instanceof SyntaxError || error.message === 'Invalid saved exercise') {
      notice = 'Saved exercise data could not be read. This exercise has started fresh.';
    } else {
      storageFailed = true;
      notice = 'Browser storage is unavailable. The exercise still works, but progress may be lost on refresh.';
    }
    return freshState();
  }
}

let state = restoreState();

function save() {
  try {
    const { telemetry, events, lastCheck, ...saved } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    if (storageFailed) {
      storageFailed = false;
      notice = 'Browser storage is available again. Your current work has been saved.';
    }
  } catch {
    storageFailed = true;
    notice = 'Browser storage cannot save progress. Keep this tab open to continue; refresh may lose your work.';
  }
  $('save-status').textContent = storageFailed ? 'Progress is not being saved' : 'Progress saved on this device';
  $('storage-notice').hidden = !notice;
  $('storage-notice').textContent = notice;
}

function announce(message) { $('status-announcement').textContent = message; }
function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000);
}

function timeText(ticks) {
  return `${String(Math.floor(ticks / 3600)).padStart(2, '0')}:${String(Math.floor(ticks / 60) % 60).padStart(2, '0')}:${String(ticks % 60).padStart(2, '0')}`;
}
function ageText(age) { return age === null ? 'No evidence' : `${age} sec`; }

function log(text, type = 'info') {
  state.events.push({ time: state.telemetry.ticks, text, type });
  state.events = state.events.slice(-30);
  renderLog();
}

function renderLog() {
  $('event-log').replaceChildren(...[...state.events].reverse().map((event) => {
    const item = document.createElement('li');
    item.className = event.type;
    const time = document.createElement('time');
    time.textContent = timeText(event.time);
    const message = document.createElement('span');
    message.textContent = event.text;
    item.append(time, message);
    return item;
  }));
}

function badge(id, text, type) {
  $(id).textContent = text;
  $(id).className = `status-badge ${type}`;
}

function renderEvidence() {
  const telemetry = state.telemetry;
  const applied = state.appliedSettings;
  badge('source-badge', telemetry.sourceFresh ? 'Fresh' : state.sourceRunning ? 'Waiting' : 'Paused', telemetry.sourceFresh ? 'healthy' : 'paused');
  badge('output-badge', telemetry.outputFresh ? 'Emitting' : !applied.enabled ? 'Disabled' : 'Waiting', telemetry.outputFresh ? 'healthy' : 'paused');
  badge('receiver-badge', telemetry.navigationFresh ? 'Navigation valid' : telemetry.receiverFresh ? 'Packets only' : !state.sourceRunning ? 'Paused' : 'No packets', telemetry.navigationFresh ? 'healthy' : !state.sourceRunning ? 'paused' : 'warning');
  $('source-count').textContent = String(telemetry.sourceCount);
  $('source-age').textContent = ageText(telemetry.sourceAge);
  $('source-position').textContent = telemetry.sourceCount ? `E ${(412300 + Math.sin(telemetry.sourceCount / 20) * 25).toFixed(1)} / N ${(5824000 + telemetry.sourceCount * .5).toFixed(1)}` : 'Waiting for update';
  $('output-destination').textContent = `${applied.destination} : ${applied.port}`;
  $('output-protocol').textContent = `${applied.protocol}${applied.enabled ? ' · enabled' : ' · disabled'}`;
  $('output-position-source').textContent = applied.positionSource === 'towfish' ? 'Towfish fixture' : 'Vessel fixture';
  $('output-messages').textContent = applied.messages.join(' · ') || 'None selected';
  $('output-evidence').textContent = `${telemetry.outputCount} / ${ageText(telemetry.outputAge)}`;
  $('receiver-evidence').textContent = `${telemetry.receiverCount} / ${ageText(telemetry.receiverAge)}`;
  $('navigation-evidence').textContent = `${telemetry.validCount} / ${ageText(telemetry.navAge)}`;
  $('receiver-position-source').textContent = telemetry.receiverCount ? `${telemetry.positionSource === 'towfish' ? 'Towfish' : 'Vessel'} fixture${telemetry.receiverFresh ? '' : ' · last received'}` : 'None received';
  $('navigation-status').textContent = telemetry.navigationFresh ? 'Valid fixture navigation' : telemetry.receiverFresh ? 'Invalid: source or bundle mismatch' : telemetry.validCount ? 'Last navigation retained · not fresh' : 'Unavailable';
  const dot = document.createElement('span');
  dot.className = 'dot';
  $('source-status').replaceChildren(dot, document.createTextNode(state.sourceRunning ? 'Source running' : 'Source paused'));
  $('source-status').classList.toggle('paused', !state.sourceRunning);
  $('toggle-source').textContent = state.sourceRunning ? 'Ⅱ' : '▶';
  $('toggle-source').setAttribute('aria-label', state.sourceRunning ? 'Pause simulated source' : 'Resume simulated source');
}

function renderInspections() {
  $('inspection-count').textContent = `${state.inspections.length} / 3`;
  for (const stage of ['source', 'output', 'receiver']) {
    const inspected = state.inspections.includes(stage);
    const step = $(`inspect-step-${stage}`);
    step.classList.toggle('done', inspected);
    step.querySelector('.step-number').textContent = inspected ? '✓' : String(['source', 'output', 'receiver'].indexOf(stage) + 1);
    step.setAttribute('aria-label', `${stage} evidence: ${inspected ? 'inspected' : 'pending'}`);
    const button = document.querySelector(`[data-inspect="${stage}"]`);
    button.classList.toggle('inspected', inspected);
    button.textContent = inspected ? `Inspected ✓ · review ${stage} again` : `Inspect ${stage} evidence`;
  }
}

function draftsApplied() { return outputKey(state.draftSettings) !== null && outputKey(state.draftSettings) === outputKey(state.appliedSettings); }

function renderDraft() {
  const matched = draftsApplied();
  const dot = document.createElement('span');
  dot.className = 'dot';
  $('draft-status').classList.toggle('pending', !matched);
  $('draft-status').replaceChildren(dot, document.createTextNode(matched ? 'Settings match the applied output' : 'Draft changes · not applied'));
  for (const field of ['destination', 'port', 'protocol', 'positionSource', 'enabled', 'messages']) {
    $(`${field}-error`).textContent = formErrors[field] || '';
    if (field !== 'messages') $(field).setAttribute('aria-invalid', formErrors[field] ? 'true' : 'false');
  }
}

function renderHints() {
  $('hint-count').textContent = `${state.hints} / ${SCENARIO.hints.length}`;
  $('reveal-hint').disabled = state.hints >= SCENARIO.hints.length;
  $('hints').replaceChildren(...SCENARIO.hints.slice(0, state.hints).map((hint, index) => {
    const paragraph = document.createElement('p');
    const title = document.createElement('strong');
    title.textContent = `HINT ${index + 1}`;
    paragraph.append(title, document.createTextNode(hint));
    return paragraph;
  }));
}

function renderResults() {
  const container = $('check-results');
  container.hidden = !state.lastCheck;
  container.replaceChildren();
  $('completion').hidden = !state.completed;
  if (!state.lastCheck) return;
  const heading = document.createElement('p');
  heading.className = 'result-heading';
  heading.textContent = `Last check: ${state.lastCheck.passed} of ${state.lastCheck.total} criteria met`;
  const list = document.createElement('ul');
  list.className = 'result-list';
  for (const check of state.lastCheck.checks) {
    const item = document.createElement('li');
    item.classList.toggle('passed', check.passed);
    const icon = document.createElement('span');
    icon.className = 'result-icon';
    icon.textContent = check.passed ? '✓' : '○';
    icon.setAttribute('aria-hidden', 'true');
    const content = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = `${check.passed ? 'Passed' : 'To do'}: ${check.label}`;
    const detail = document.createElement('p');
    detail.textContent = check.detail;
    content.append(title, detail);
    item.append(icon, content);
    list.append(item);
  }
  container.append(heading, list);
}

function clearAssessment() {
  state.lastCheck = null;
  state.completed = false;
  renderResults();
}

function readDraft() {
  return {
    destination: $('destination').value, port: $('port').value, protocol: $('protocol').value,
    positionSource: $('positionSource').value, enabled: $('enabled').checked,
    messages: [...document.querySelectorAll('input[name="messages"]:checked')].map((input) => input.value),
  };
}

function updateDraft() {
  state.draftSettings = readDraft();
  formErrors = {};
  clearAssessment();
  renderDraft();
  save();
}

function syncForm() {
  const draft = state.draftSettings;
  for (const field of ['destination', 'port', 'protocol', 'positionSource']) $(field).value = draft[field];
  $('enabled').checked = draft.enabled;
  for (const input of document.querySelectorAll('input[name="messages"]')) input.checked = draft.messages.includes(input.value);
  $('diagnosis').value = state.diagnosis;
  $('notes').value = state.notes;
}

function renderAll() {
  renderEvidence(); renderDraft(); renderHints(); renderInspections(); renderResults(); renderLog();
}

function tick() {
  const previous = state.telemetry;
  state.telemetry = advanceTelemetry(previous, state.appliedSettings, state.sourceRunning);
  const current = state.telemetry;
  if (current.sourceFresh && !previous.sourceFresh) log('Upstream towfish fixture is fresh. Source solution provenance confirmed.');
  if (current.outputFresh && !previous.outputFresh) log(`Local output emitting ${state.appliedSettings.messages.join('/')} to ${state.appliedSettings.destination}:${state.appliedSettings.port} over ${state.appliedSettings.protocol}.`);
  if (current.receiverFresh && !previous.receiverFresh) {
    log('Sonar receiver has fresh packets from the applied output.', 'positive');
    announce('Sonar receiver has fresh packets. Check navigation validity separately.');
  }
  if (current.navigationFresh && !previous.navigationFresh) {
    log('Receiver navigation valid: towfish provenance and all four fixture messages present.', 'positive');
    announce('Valid towfish navigation fixture received.');
  }
  renderEvidence();
}

function resetExercise() {
  state = freshState();
  formErrors = {};
  notice = '';
  syncForm(); renderAll(); save();
  toast('Towfish exercise reset. Destination starts at 192.0.2.42 again.');
  $('destination').focus();
}

for (const item of SCENARIO.diagnoses) {
  const option = document.createElement('option');
  option.value = item.value;
  option.textContent = item.label;
  $('diagnosis').append(option);
}
for (const field of ['destination', 'port']) $(field).addEventListener('input', updateDraft);
for (const field of ['protocol', 'positionSource', 'enabled']) $(field).addEventListener('change', updateDraft);
for (const input of document.querySelectorAll('input[name="messages"]')) input.addEventListener('change', updateDraft);

$('settings-form').addEventListener('submit', (event) => {
  event.preventDefault();
  updateDraft();
  const validation = validateOutput(state.draftSettings);
  formErrors = validation.errors;
  renderDraft();
  if (!validation.valid) {
    const field = Object.keys(validation.errors)[0];
    const target = $(field) || document.querySelector('input[name="messages"]');
    target.focus();
    announce(`Output was not applied. ${validation.errors[field]}`);
    return;
  }
  state.appliedSettings = validation.settings;
  state.telemetry = { ...state.telemetry, outputCount: 0, receiverCount: 0, validCount: 0, outputFresh: false, receiverFresh: false, navigationFresh: false, outputAge: null, receiverAge: null, navAge: null, settingsKey: outputKey(state.appliedSettings), positionSource: state.appliedSettings.positionSource };
  log(`Applied output: ${state.appliedSettings.destination}:${state.appliedSettings.port}, ${state.appliedSettings.protocol}, ${state.appliedSettings.positionSource}, ${state.appliedSettings.messages.join('/') || 'no messages'}, ${state.appliedSettings.enabled ? 'enabled' : 'disabled'}.`);
  renderDraft(); renderEvidence(); save();
  toast(state.sourceRunning ? 'Output applied. Verify receiver packets and valid navigation at the next update.' : 'Output applied. Resume the source to verify fresh evidence.');
});

for (const button of document.querySelectorAll('[data-inspect]')) button.addEventListener('click', () => {
  const stage = button.dataset.inspect;
  if (!state.inspections.includes(stage)) state.inspections.push(stage);
  renderInspections(); save();
  const telemetry = state.telemetry;
  const message = stage === 'source' ? `Source inspected: ${telemetry.sourceCount} towfish solutions, age ${ageText(telemetry.sourceAge)}.` : stage === 'output' ? `Output inspected: ${telemetry.outputCount} packets emitted to ${state.appliedSettings.destination}. Emission does not prove receipt.` : `Receiver inspected: ${telemetry.receiverCount} packets; ${telemetry.validCount} valid navigation updates. Current navigation ${telemetry.navigationFresh ? 'valid' : 'unavailable or invalid'}.`;
  log(message); toast(message);
});

$('toggle-source').addEventListener('click', () => {
  state.sourceRunning = !state.sourceRunning;
  state.telemetry = { ...state.telemetry, sourceFresh: false, outputFresh: false, receiverFresh: false, navigationFresh: false };
  log(state.sourceRunning ? 'Synthetic source resumed. Fresh evidence will update on the next tick.' : 'Synthetic source paused. Existing counters are retained; evidence is not live.');
  renderEvidence(); save();
  announce(state.sourceRunning ? 'Source resumed.' : 'Source paused. Live verification is unavailable.');
});
$('reveal-hint').addEventListener('click', () => {
  state.hints = Math.min(state.hints + 1, SCENARIO.hints.length);
  renderHints(); save(); announce(`Hint ${state.hints}. ${SCENARIO.hints[state.hints - 1]}`);
});
$('diagnosis').addEventListener('change', () => { state.diagnosis = $('diagnosis').value; clearAssessment(); save(); });
$('notes').addEventListener('input', () => { state.notes = $('notes').value.slice(0, 1200); save(); });
$('check-exercise').addEventListener('click', () => {
  state.lastCheck = gradeSonarExercise(state);
  state.completed = state.lastCheck.complete;
  log(state.completed ? 'Exercise complete: output configuration, inspections, receipt, towfish navigation and original diagnosis verified.' : `Exercise checked: ${state.lastCheck.passed} of ${state.lastCheck.total} criteria met.`, state.completed ? 'positive' : 'warning');
  renderResults(); save();
  announce(state.completed ? 'Exercise complete. All five criteria met.' : `${state.lastCheck.passed} of ${state.lastCheck.total} criteria met. Review the feedback.`);
  if (state.completed) $('completion').scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});
for (const id of ['reset-exercise', 'restart-completed']) $(id).addEventListener('click', () => { $('reset-dialog').returnValue = ''; $('reset-dialog').showModal(); });
$('reset-dialog').addEventListener('close', () => { if ($('reset-dialog').returnValue === 'reset') resetExercise(); });

// Move the existing help controls on small screens rather than duplicating IDs.
const sidebar = document.querySelector('.sidebar');
const support = document.createElement('section');
support.className = 'mobile-support';
support.setAttribute('aria-label', 'Evidence inspections and help');
document.querySelector('.page-footer').before(support);
const helpControls = [$('inspection-list').previousElementSibling, $('inspection-list'), document.querySelector('.hint-card'), document.querySelector('.sidebar-bottom')];
const smallScreen = window.matchMedia('(max-width: 740px)');
function moveHelp() { (smallScreen.matches ? support : sidebar).append(...helpControls); support.hidden = !smallScreen.matches; }
smallScreen.addEventListener('change', moveHelp);
moveHelp();
syncForm(); renderAll(); save();
setInterval(tick, 1000);
