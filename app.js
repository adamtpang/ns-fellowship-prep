const boxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
const total = boxes.length;
const storageKey = 'ns-fellowship-prep-v1';

function readStoredState() {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || '{}');
  } catch {
    return {};
  }
}

let state = readStoredState();

function persistState() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The checklist still works for this page view when storage is unavailable.
  }
}

function labelFor(score) {
  const ratio = total ? score / total : 0;
  if (ratio === 0) return 'just starting';
  if (ratio < 0.35) return 'getting oriented';
  if (ratio < 0.7) return 'getting sharp';
  if (ratio < 1) return 'nearly there';
  return 'checklist complete';
}

function render() {
  let score = 0;
  boxes.forEach((box) => {
    box.checked = Boolean(state[box.dataset.id]);
    if (box.checked) score += 1;
  });

  document.getElementById('score-num').textContent = `${score} / ${total}`;
  document.getElementById('score-label').textContent = labelFor(score);
  document.getElementById('fill').style.width = `${total ? (score / total) * 100 : 0}%`;
  document.getElementById('progress').setAttribute('aria-valuenow', String(score));
  document.getElementById('progress').setAttribute('aria-valuemax', String(total));
}

boxes.forEach((box) => {
  box.addEventListener('change', () => {
    state[box.dataset.id] = box.checked;
    persistState();
    render();
  });
});

document.getElementById('reset').addEventListener('click', () => {
  state = {};
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // There is nothing else to clear when browser storage is unavailable.
  }
  render();
});

render();
