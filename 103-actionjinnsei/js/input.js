// 入力管理システム

const keys = {
  left: false,
  right: false,
  jump: false,
  aBtn: false,
  bBtn: false,
  analogX: 0
};

function resetKeys() {
  keys.left = false;
  keys.right = false;
  keys.jump = false;
  keys.aBtn = false;
  keys.bBtn = false;
  keys.analogX = 0;
}

function setupControls() {
  const stickContainer = document.getElementById('stick-container');
  const stickKnob = document.getElementById('stick-knob');
  let stickId = null;
  const maxDistance = 35;

  if (stickContainer && stickKnob) {
    stickContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      stickId = touch.identifier;
      stickContainer.classList.add('active');
      stickKnob.classList.add('active');
      updateStick(touch.clientX, touch.clientY);
    }, { passive: false });

    stickContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === stickId) {
          updateStick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }, { passive: false });

    const endStick = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === stickId) {
          stickId = null;
          resetStick();
          break;
        }
      }
    };

    stickContainer.addEventListener('touchend', endStick);
    stickContainer.addEventListener('touchcancel', endStick);
  }

  function updateStick(clientX, clientY) {
    const rect = stickContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - (rect.top + rect.height / 2);
    const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    const knobX = Math.cos(angle) * distance;
    const knobY = Math.sin(angle) * distance;
    stickKnob.style.transform = 'translate(' + knobX + 'px, ' + knobY + 'px)';
    stickKnob.style.transition = 'none';

    const threshold = 8;
    keys.analogX = distance > threshold ? (deltaX / maxDistance) : 0;
    keys.right = keys.analogX > 0.15;
    keys.left = keys.analogX < -0.15;
  }

  function resetStick() {
    stickKnob.style.transform = 'translate(0px, 0px)';
    stickKnob.style.transition = 'transform 0.15s';
    stickContainer.classList.remove('active');
    stickKnob.classList.remove('active');
    keys.right = false;
    keys.left = false;
    keys.analogX = 0;
  }

  const bindButton = (id, keyName, holdMode) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      keys[keyName] = true;
      btn.style.transform = 'scale(0.9)';
      btn.classList.add('touched');
      if (navigator.vibrate) navigator.vibrate(12);
    }, { passive: false });

    const releaseBtn = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!holdMode) keys[keyName] = false;
      else keys[keyName] = false;
      btn.style.transform = 'scale(1.0)';
      btn.classList.remove('touched');
    };

    btn.addEventListener('touchend', releaseBtn, { passive: false });
    btn.addEventListener('touchcancel', releaseBtn, { passive: false });

    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      keys[keyName] = true;
      btn.style.transform = 'scale(0.9)';
      btn.classList.add('touched');
    });

    btn.addEventListener('mouseup', (e) => {
      e.preventDefault();
      keys[keyName] = false;
      btn.style.transform = 'scale(1.0)';
      btn.classList.remove('touched');
    });

    btn.addEventListener('mouseleave', () => {
      keys[keyName] = false;
      btn.style.transform = 'scale(1.0)';
      btn.classList.remove('touched');
    });
  };

  bindButton('btn-jump-touch', 'jump', false);
  bindButton('btn-a-touch', 'aBtn', false);
  bindButton('btn-b-touch', 'bBtn', true);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
  if (e.key === 'ArrowUp' || e.key === ' ') keys.jump = true;
  if (e.key === 'z' || e.key === 'Z') keys.aBtn = true;
  if (e.key === 'x' || e.key === 'X') keys.bBtn = true;
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
  if (e.key === 'ArrowUp' || e.key === ' ') keys.jump = false;
  if (e.key === 'z' || e.key === 'Z') keys.aBtn = false;
  if (e.key === 'x' || e.key === 'X') keys.bBtn = false;
});

let resizeTimer;
function handleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {}, 100);
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    handleResize();
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
  }, 100);
});

document.addEventListener('gesturestart', (e) => { e.preventDefault(); });
document.addEventListener('gesturechange', (e) => { e.preventDefault(); });
document.addEventListener('gestureend', (e) => { e.preventDefault(); });
