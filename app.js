import { DIAGNOSES, INITIAL_SETTINGS, validateSettings, settingsKey, matchesSource, gradeExercise } from './grader.js';

const STORAGE_KEY = 'survey-lab.exercise-01.v1';
const $ = (id) => document.getElementById(id);
const HINTS = [
  'The source setup sheet describes the transmitter. A listener needs the same protocol, destination port and message type to receive this simulated feed.',
  'Compare the source destination port with the starting listening port. The source uses 5001; the starting listener uses 5002.',
  'Keep UDP and GGA, change the listening port to 5001, and apply. Wait for an incoming message, then select the diagnosis about ports and check the exercise.',
];
let storageFailure = false;
let storageNotice = '';
let toastTimer;
let formErrors = {};

function freshState() {
  return {
    version: 1, appliedSettings: { ...INITIAL_SETTINGS }, draftSettings: { ...INITIAL_SETTINGS, port: String(INITIAL_SETTINGS.port) },
    sourceRunning: true, sourceTicks: 0, elapsed: 0, hints: 0, setupReviewed: false, diagnosis: '', notes: '',
    telemetry: { receiving: false, received: 0, settingsKey: settingsKey(INITIAL_SETTINGS), lastAt: null, position: null },
    track: [], events: [{ time: 0, text: 'Exercise started. The synthetic UDP transmitter is running.', type: 'info' }, { time: 0, text: 'Listener opened on UDP port 5002. No matching position messages.', type: 'warning' }],
    hasChecked: false, completed: false, lastCheck: null,
  };
}

function boundedInteger(value, fallback = 0, max = 1_000_000) {
  return Number.isInteger(value) && value >= 0 && value <= max ? value : fallback;
}

function validPoint(value) {
  return Array.isArray(value) && value.length === 2 && value.every((number) => Number.isFinite(number)) && value[0] >= 0 && value[0] <= 760 && value[1] >= 0 && value[1] <= 360;
}

function restoreState() {
  const fallback = freshState();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;
    const raw = JSON.parse(saved);
    if (!raw || raw.version !== 1 || !validateSettings(raw.appliedSettings).valid || !raw.draftSettings || typeof raw.draftSettings.port !== 'string') throw new Error('Invalid saved state');
    const restored = {
      ...fallback,
      appliedSettings: validateSettings(raw.appliedSettings).settings,
      draftSettings: { protocol: ['UDP', 'TCP'].includes(raw.draftSettings.protocol) ? raw.draftSettings.protocol : 'UDP', port: raw.draftSettings.port.slice(0, 32), message: ['GGA', 'RMC'].includes(raw.draftSettings.message) ? raw.draftSettings.message : 'GGA' },
      sourceRunning: raw.sourceRunning !== false, sourceTicks: boundedInteger(raw.sourceTicks), elapsed: boundedInteger(raw.elapsed),
      hints: boundedInteger(raw.hints, 0, 3), setupReviewed: raw.setupReviewed === true,
      diagnosis: DIAGNOSES.some((item) => item.value === raw.diagnosis) ? raw.diagnosis : '',
      notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 1200) : '',
      track: Array.isArray(raw.track) ? raw.track.filter(validPoint).slice(-120) : [],
      events: Array.isArray(raw.events) ? raw.events.filter((event) => event && typeof event.text === 'string' && ['info', 'warning', 'positive'].includes(event.type)).slice(-35).map((event) => ({ time: boundedInteger(event.time), text: event.text.slice(0, 250), type: event.type })) : fallback.events,
      telemetry: {
        receiving: false,
        received: boundedInteger(raw.telemetry?.received),
        settingsKey: typeof raw.telemetry?.settingsKey === 'string' ? raw.telemetry.settingsKey : null,
        lastAt: Number.isInteger(raw.telemetry?.lastAt) && raw.telemetry.lastAt >= 0 && raw.telemetry.lastAt <= boundedInteger(raw.elapsed) ? raw.telemetry.lastAt : null,
        position: validPoint(raw.telemetry?.position) ? raw.telemetry.position : null,
      },
      hasChecked: raw.hasChecked === true,
    };
    // Completion records a past verified receipt. A paused or refreshed source does not undo that achievement.
    const pastCheck = gradeExercise({ ...restored, telemetry: { ...restored.telemetry, receiving: restored.telemetry.received > 0 } });
    restored.completed = raw.completed === true && pastCheck.complete;
    restored.lastCheck = restored.hasChecked ? restored.completed ? pastCheck : gradeExercise(restored) : null;
    storageNotice = 'Saved exercise restored. The simulated listener will update when the source runs.';
    return restored;
  } catch (error) {
    if (error instanceof SyntaxError || error.message === 'Invalid saved state') {
      storageNotice = 'Saved progress could not be read. A fresh exercise has been started.';
    } else {
      storageFailure = true;
      storageNotice = 'Browser storage is unavailable. You can complete the exercise, but progress may be lost on refresh.';
    }
    return fallback;
  }
}

let state = restoreState();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (storageFailure) {
      storageFailure = false;
      storageNotice = 'Browser storage is available again. Your current progress has been saved.';
    }
  } catch {
    storageFailure = true;
    storageNotice = 'Progress cannot be saved in browser storage. Keep this tab open to continue; a refresh may lose your work.';
  }
  $('save-status').textContent = storageFailure ? 'Progress is not being saved' : 'Progress saved on this device';
  $('storage-notice').hidden = !storageNotice;
  $('storage-notice').textContent = storageNotice;
}

function announce(message) {
  $('status-announcement').textContent = message;
}

function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000);
}

function formatTime(time) {
  const hours = String(Math.floor(time / 3600)).padStart(2, '0');
  const minutes = String(Math.floor(time / 60) % 60).padStart(2, '0');
  const seconds = String(time % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function log(text, type = 'info') {
  state.events.push({ time: state.elapsed, text, type });
  state.events = state.events.slice(-35);
  renderLog();
}

function renderLog() {
  $('event-log').replaceChildren(...[...state.events].reverse().map((event) => {
    const li = document.createElement('li');
    li.className = event.type;
    const time = document.createElement('time');
    time.textContent = formatTime(event.time);
    const text = document.createElement('span');
    text.textContent = event.text;
    li.append(time, text);
    return li;
  }));
}

function sourcePoint() {
  // The route is a visual training aid, not a hydrodynamic or geographic model.
  const fraction = (state.sourceTicks % 180) / 180;
  const route = $('planned-route');
  const point = route.getPointAtLength(route.getTotalLength() * fraction);
  return [Number(point.x.toFixed(2)), Number(point.y.toFixed(2))];
}

function renderMap() {
  const point = sourcePoint();
  $('source-marker').setAttribute('transform', `translate(${point[0]} ${point[1]}) rotate(48)`);
  $('received-track').setAttribute('points', state.track.map((position) => position.join(',')).join(' '));
  $('position-marker').hidden = !state.telemetry.position;
  // SVG does not consistently expose the HTML hidden property; use the attribute as well.
  $('position-marker').toggleAttribute('hidden', !state.telemetry.position);
  if (state.telemetry.position) $('position-marker').setAttribute('transform', `translate(${state.telemetry.position[0]} ${state.telemetry.position[1]}) rotate(48)`);
  const overlay = $('map-overlay');
  const strong = overlay.querySelector('strong');
  const detail = overlay.querySelector('div>span');
  overlay.classList.toggle('healthy', state.telemetry.receiving);
  overlay.querySelector('.warning-icon').textContent = state.telemetry.receiving ? '✓' : '!';
  if (state.telemetry.receiving) {
    strong.textContent = 'Position feed receiving';
    detail.textContent = 'Your listener is receiving simulated GGA messages.';
  } else if (!state.sourceRunning) {
    strong.textContent = 'Simulated source paused';
    detail.textContent = state.telemetry.position ? 'The last received position is retained. Resume to verify.' : 'Resume the source to receive new messages.';
  } else {
    strong.textContent = matchesSource(state.appliedSettings) ? 'Waiting for the next message' : 'Position feed unavailable';
    detail.textContent = 'The source is active. Check the applied listener.';
  }
}

function renderTelemetry() {
  const { telemetry } = state;
  const badge = $('sensor-badge');
  badge.textContent = telemetry.receiving ? 'Receiving' : state.sourceRunning ? 'No data' : 'Paused';
  badge.className = `status-badge ${telemetry.receiving ? 'healthy' : state.sourceRunning ? 'warning' : 'paused'}`;
  $('sensor-description').textContent = telemetry.receiving ? 'Incoming position data · simulated fix' : !state.sourceRunning ? 'Source paused. Resume it to verify reception.' : 'No messages match the applied listener.';
  $('applied-summary').textContent = `${state.appliedSettings.protocol} : ${state.appliedSettings.port} · ${state.appliedSettings.message}`;
  $('source-status').classList.toggle('paused', !state.sourceRunning);
  $('source-status').replaceChildren();
  const dot = document.createElement('span');
  dot.className = 'dot';
  $('source-status').append(dot, document.createTextNode(state.sourceRunning ? 'Source running' : 'Source paused'));
  $('toggle-source').textContent = state.sourceRunning ? 'Ⅱ' : '▶';
  const action = state.sourceRunning ? 'Pause simulated source' : 'Resume simulated source';
  $('toggle-source').setAttribute('aria-label', action);
  $('toggle-source').title = action;
  const count = document.createTextNode(`${telemetry.received} `);
  const small = document.createElement('small');
  small.textContent = telemetry.received === 1 ? 'message' : 'messages';
  $('received-value').replaceChildren(count, small);
  $('age-value').textContent = telemetry.lastAt === null ? 'No data' : `${state.elapsed - telemetry.lastAt} sec`;
  if (telemetry.position) {
    const easting = (412300 + telemetry.position[0] - 212).toFixed(1);
    const northing = (5824000 + 249 - telemetry.position[1]).toFixed(1);
    $('position-value').textContent = `${easting} / ${northing}`;
    $('message-preview').textContent = `SIM · GGA · ${formatTime(telemetry.lastAt ?? 0)} · E ${easting} · N ${northing} · fix received`;
  } else {
    $('position-value').textContent = '— / —';
    $('message-preview').textContent = 'Waiting for a matching listener…';
  }
  renderMap();
  renderMission();
}

function draftsMatchApplied() {
  return settingsKey(state.draftSettings) !== null && settingsKey(state.draftSettings) === settingsKey(state.appliedSettings);
}

function renderDraft() {
  const matched = draftsMatchApplied();
  const status = $('draft-status');
  status.classList.toggle('pending', !matched);
  const dot = document.createElement('span');
  dot.className = 'dot';
  status.replaceChildren(dot, document.createTextNode(matched ? 'Settings match the applied listener' : 'Draft changes · not applied'));
  for (const field of ['protocol', 'port', 'message']) {
    $(`${field}-error`).textContent = formErrors[field] || '';
    $(field).setAttribute('aria-invalid', formErrors[field] ? 'true' : 'false');
  }
}

function renderMission() {
  const achieved = [state.setupReviewed, matchesSource(state.appliedSettings), state.telemetry.received > 0 && state.telemetry.settingsKey === settingsKey(state.appliedSettings), state.completed];
  let currentMarked = false;
  ['review', 'apply', 'receive', 'complete'].forEach((id, index) => {
    const element = $(`step-${id}`);
    element.classList.toggle('done', achieved[index]);
    const current = !achieved[index] && !currentMarked;
    element.classList.toggle('current', current);
    if (current) currentMarked = true;
    element.querySelector('.step-number').textContent = achieved[index] ? '✓' : String(index + 1);
    element.setAttribute('aria-label', `${index + 1}. ${element.querySelector('strong').textContent}: ${achieved[index] ? 'complete' : 'pending'}`);
  });
  $('mission-count').textContent = `${achieved.filter(Boolean).length} / 4`;
  $('mark-reviewed').textContent = state.setupReviewed ? 'Reviewed ✓' : 'Mark as reviewed';
  $('mark-reviewed').disabled = state.setupReviewed;
}

function renderHints() {
  $('hint-count').textContent = `${state.hints} / 3`;
  $('reveal-hint').disabled = state.hints >= HINTS.length;
  $('hints').replaceChildren(...HINTS.slice(0, state.hints).map((hint, index) => {
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
  heading.textContent = state.lastCheck.complete ? 'Last check: all 3 criteria met' : `Last check: ${state.lastCheck.passed} of ${state.lastCheck.total} criteria met`;
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
  state.hasChecked = false;
  state.completed = false;
  state.lastCheck = null;
  renderResults();
  renderMission();
}

function updateDraft() {
  state.draftSettings = { protocol: $('protocol').value, port: $('port').value, message: $('message').value };
  formErrors = {};
  clearAssessment();
  renderDraft();
  save();
}

function syncForm() {
  $('protocol').value = state.draftSettings.protocol;
  $('port').value = state.draftSettings.port;
  $('message').value = state.draftSettings.message;
  $('diagnosis').value = state.diagnosis;
  $('notes').value = state.notes;
}

function tick() {
  state.elapsed += 1;
  if (state.sourceRunning) state.sourceTicks += 1;
  const wasReceiving = state.telemetry.receiving;
  state.telemetry.receiving = state.sourceRunning && matchesSource(state.appliedSettings);
  if (state.telemetry.receiving) {
    const point = sourcePoint();
    state.telemetry.received += 1;
    state.telemetry.lastAt = state.elapsed;
    state.telemetry.position = point;
    state.telemetry.settingsKey = settingsKey(state.appliedSettings);
    if (state.sourceTicks % 180 === 0) state.track = [];
    state.track.push(point);
    state.track = state.track.slice(-120);
    if (!wasReceiving) {
      log(`Position feed receiving. Simulated GGA messages on UDP port ${state.appliedSettings.port}.`, 'positive');
      announce('Position feed receiving. Incoming simulated GGA messages are available.');
    }
  }
  renderTelemetry();
  save();
}

function resetExercise() {
  state = freshState();
  formErrors = {};
  syncForm();
  renderDraft();
  renderTelemetry();
  renderLog();
  renderHints();
  renderResults();
  storageNotice = '';
  save();
  toast('Exercise reset. The listener starts on UDP port 5002 again.');
  $('port').focus();
}

for (const item of DIAGNOSES) {
  const option = document.createElement('option');
  option.value = item.value;
  option.textContent = item.label;
  $('diagnosis').append(option);
}

for (const field of ['protocol', 'port', 'message']) $(field).addEventListener(field === 'port' ? 'input' : 'change', updateDraft);

$('settings-form').addEventListener('submit', (event) => {
  event.preventDefault();
  updateDraft();
  const validation = validateSettings(state.draftSettings);
  formErrors = validation.errors;
  renderDraft();
  if (!validation.valid) {
    const field = Object.keys(validation.errors)[0];
    $(field).focus();
    announce(`Settings were not applied. ${validation.errors[field]}`);
    return;
  }
  state.appliedSettings = validation.settings;
  state.telemetry = { receiving: false, received: 0, settingsKey: settingsKey(state.appliedSettings), lastAt: null, position: null };
  state.track = [];
  log(`Listener applied: ${state.appliedSettings.protocol} port ${state.appliedSettings.port}, ${state.appliedSettings.message}. Waiting for incoming messages.`, 'info');
  renderDraft();
  renderTelemetry();
  save();
  toast(state.sourceRunning ? 'Listener applied. Watch the sensor monitor for incoming data.' : 'Listener applied. Resume the simulated source to verify reception.');
});

$('toggle-source').addEventListener('click', () => {
  state.sourceRunning = !state.sourceRunning;
  state.telemetry.receiving = false;
  log(state.sourceRunning ? 'Synthetic source resumed.' : 'Synthetic source paused. No new messages will be received.', 'info');
  renderTelemetry();
  save();
  announce(state.sourceRunning ? 'Source resumed. Waiting for the next message.' : 'Source paused.');
});

$('mark-reviewed').addEventListener('click', () => {
  state.setupReviewed = true;
  renderMission();
  save();
  toast('Setup sheet reviewed. Compare it with the applied listener.');
});

$('reveal-hint').addEventListener('click', () => {
  state.hints = Math.min(state.hints + 1, HINTS.length);
  renderHints();
  save();
  announce(`Hint ${state.hints}. ${HINTS[state.hints - 1]}`);
});

$('diagnosis').addEventListener('change', () => {
  state.diagnosis = $('diagnosis').value;
  clearAssessment();
  save();
});

$('notes').addEventListener('input', () => {
  state.notes = $('notes').value.slice(0, 1200);
  save();
});

$('check-exercise').addEventListener('click', () => {
  state.lastCheck = gradeExercise(state);
  state.hasChecked = true;
  state.completed = state.lastCheck.complete;
  if (state.completed) state.setupReviewed = true;
  log(state.completed ? 'Exercise complete. Applied listener, incoming data and original port mismatch verified.' : `Exercise checked: ${state.lastCheck.passed} of ${state.lastCheck.total} criteria met.`, state.completed ? 'positive' : 'warning');
  renderResults();
  renderMission();
  save();
  announce(state.completed ? 'Exercise complete. All three criteria met. Position feed restored.' : `${state.lastCheck.passed} of ${state.lastCheck.total} criteria met. Review the feedback below the check button.`);
  if (state.completed) $('completion').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
});

for (const id of ['reset-exercise', 'restart-completed']) $(id).addEventListener('click', () => {
  $('reset-dialog').returnValue = '';
  $('reset-dialog').showModal();
});
$('reset-dialog').addEventListener('close', () => {
  if ($('reset-dialog').returnValue === 'reset') resetExercise();
});

// The same controls move below the console on small screens, preserving keyboard access and IDs.
const mobileSupport = document.createElement('section');
mobileSupport.className = 'mobile-support';
mobileSupport.setAttribute('aria-label', 'Mission progress and help');
document.querySelector('.page-footer').before(mobileSupport);
const sidebar = document.querySelector('.sidebar');
const supportingControls = [$('mission-list').previousElementSibling, $('mission-list'), document.querySelector('.hint-card'), document.querySelector('.sidebar-bottom')];
const smallScreen = window.matchMedia('(max-width: 740px)');
function moveSupportingControls() {
  const target = smallScreen.matches ? mobileSupport : sidebar;
  target.append(...supportingControls);
  mobileSupport.hidden = !smallScreen.matches;
}
smallScreen.addEventListener('change', moveSupportingControls);
moveSupportingControls();

syncForm();
renderDraft();
renderTelemetry();
renderLog();
renderHints();
renderResults();
save();
setInterval(tick, 1000);
