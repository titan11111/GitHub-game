const KEY = 'ffclone_save';
const SLOTS = 3;

export function saveGame(slot, data) {
  try {
    const all = loadAll();
    all[slot] = { ...data, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch { return false; }
}

export function loadGame(slot) {
  const all = loadAll();
  return all[slot] ?? null;
}

export function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch { return {}; }
}

export function deleteSave(slot) {
  const all = loadAll();
  delete all[slot];
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function hasSave(slot) {
  return loadGame(slot) !== null;
}
