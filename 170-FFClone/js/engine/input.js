export const keys = {
  up: false, down: false, left: false, right: false,
  a: false, b: false, select: false, start: false,
  upP: false, downP: false, leftP: false, rightP: false,
  aP: false, bP: false, selectP: false, startP: false,
};

const _prev = { up: false, down: false, left: false, right: false, a: false, b: false, select: false, start: false };

export function initInput() {
  window.addEventListener('keydown', e => {
    if (['ArrowUp','w','W'].includes(e.key))    keys.up    = true;
    if (['ArrowDown','s','S'].includes(e.key))  keys.down  = true;
    if (['ArrowLeft','a','A'].includes(e.key))  keys.left  = true;
    if (['ArrowRight','d','D'].includes(e.key)) keys.right = true;
    if (['Enter','z','Z',' '].includes(e.key))  keys.a     = true;
    if (['Escape','x','X'].includes(e.key))     keys.b     = true;
    e.preventDefault();
  });
  window.addEventListener('keyup', e => {
    if (['ArrowUp','w','W'].includes(e.key))    keys.up    = false;
    if (['ArrowDown','s','S'].includes(e.key))  keys.down  = false;
    if (['ArrowLeft','a','A'].includes(e.key))  keys.left  = false;
    if (['ArrowRight','d','D'].includes(e.key)) keys.right = false;
    if (['Enter','z','Z',' '].includes(e.key))  keys.a     = false;
    if (['Escape','x','X'].includes(e.key))     keys.b     = false;
  });

  bindVirtualButton('dpad-up',    () => { keys.up    = true;  }, () => { keys.up    = false; });
  bindVirtualButton('dpad-down',  () => { keys.down  = true;  }, () => { keys.down  = false; });
  bindVirtualButton('dpad-left',  () => { keys.left  = true;  }, () => { keys.left  = false; });
  bindVirtualButton('dpad-right', () => { keys.right = true;  }, () => { keys.right = false; });
  bindVirtualButton('btn-a',      () => { keys.a      = true;  }, () => { keys.a      = false; });
  bindVirtualButton('btn-b',      () => { keys.b      = true;  }, () => { keys.b      = false; });
  bindVirtualButton('btn-select', () => { keys.select = true;  }, () => { keys.select = false; });
  bindVirtualButton('btn-start',  () => { keys.start  = true;  }, () => { keys.start  = false; });

  // double-tap prevention
  let lastTap = 0;
  document.addEventListener('touchstart', e => {
    const now = Date.now();
    if (now - lastTap < 300) e.preventDefault();
    lastTap = now;
  }, { passive: false });
}

function bindVirtualButton(id, onDown, onUp) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    onDown();
  });
  el.addEventListener('pointerup',   () => { onUp(); });
  el.addEventListener('pointercancel', () => { onUp(); });
}

export function updateInput() {
  keys.upP    = keys.up    && !_prev.up;
  keys.downP  = keys.down  && !_prev.down;
  keys.leftP  = keys.left  && !_prev.left;
  keys.rightP = keys.right && !_prev.right;
  keys.aP      = keys.a      && !_prev.a;
  keys.bP      = keys.b      && !_prev.b;
  keys.selectP = keys.select && !_prev.select;
  keys.startP  = keys.start  && !_prev.start;

  _prev.up     = keys.up;
  _prev.down   = keys.down;
  _prev.left   = keys.left;
  _prev.right  = keys.right;
  _prev.a      = keys.a;
  _prev.b      = keys.b;
  _prev.select = keys.select;
  _prev.start  = keys.start;
}
