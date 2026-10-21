// ボス交渉フェーズ制御

let negotiationState = {
  active: false,
  resolved: false,
  stage: 0,
  onSuccess: null,
  onFailure: null
};

function isNegotiationActive() {
  return negotiationState.active;
}

function startNegotiation(stageNum, callbacks) {
  const dialog = NEGOTIATION_DIALOGS[stageNum];
  if (!dialog) {
    return false;
  }

  negotiationState.active = true;
  negotiationState.resolved = false;
  negotiationState.stage = stageNum;
  negotiationState.onSuccess = callbacks && callbacks.onSuccess ? callbacks.onSuccess : null;
  negotiationState.onFailure = callbacks && callbacks.onFailure ? callbacks.onFailure : null;

  const overlay = document.getElementById('negotiation-overlay');
  const bossName = document.getElementById('negotiation-boss-name');
  const line = document.getElementById('negotiation-line');
  const hint = document.getElementById('negotiation-hint');
  const status = document.getElementById('negotiation-status');
  const optionsWrap = document.getElementById('negotiation-options');

  if (!overlay || !optionsWrap) {
    negotiationState.active = false;
    return false;
  }

  if (bossName) bossName.textContent = dialog.boss;
  if (line) line.textContent = dialog.line;
  if (hint) hint.textContent = 'ヒント: ' + dialog.hint;
  if (status) {
    status.textContent = '';
    status.className = 'negotiation-status';
  }

  optionsWrap.innerHTML = '';
  dialog.choices.forEach((choice, index) => {
    const btn = document.createElement('button');
    btn.className = 'negotiation-option';
    btn.type = 'button';
    btn.textContent = choice;
    btn.addEventListener('click', () => {
      if (!negotiationState.active || negotiationState.resolved) return;
      resolveNegotiation(index === dialog.correctIndex, index);
    });
    optionsWrap.appendChild(btn);
  });

  overlay.classList.remove('hidden');
  overlay.style.display = 'flex';
  return true;
}

function resolveNegotiation(success) {
  const overlay = document.getElementById('negotiation-overlay');
  const status = document.getElementById('negotiation-status');
  const options = document.querySelectorAll('.negotiation-option');

  options.forEach(btn => {
    btn.disabled = true;
    btn.classList.add('disabled');
  });

  if (status) {
    status.textContent = success ? '交渉成功！' : '交渉決裂！';
    status.className = success
      ? 'negotiation-status success'
      : 'negotiation-status failure';
  }

  if (typeof playSE === 'function') {
    playSE(success ? 'pickup' : 'damage');
  }

  if (overlay) {
    overlay.classList.remove('success', 'failure');
    overlay.classList.add(success ? 'success' : 'failure');
  }

  negotiationState.resolved = true;
  window.setTimeout(() => {
    closeNegotiationOverlay();
    if (success && typeof negotiationState.onSuccess === 'function') {
      negotiationState.onSuccess();
    }
    if (!success && typeof negotiationState.onFailure === 'function') {
      negotiationState.onFailure();
    }
    negotiationState.active = false;
  }, 700);
}

function closeNegotiationOverlay() {
  const overlay = document.getElementById('negotiation-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.classList.add('hidden');
  overlay.classList.remove('success', 'failure');
}
