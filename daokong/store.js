// Where 倒空 keeps its data.
// Always: localStorage on this device, so the app opens instantly and works offline.
// When opened as a claude.ai artifact by a signed-in viewer: also one private document in the
// artifact's database (data/users/<id>/state), so records survive page updates and browser
// storage being cleared, and follow the same person across devices. Only that person can read it.

const LOCAL_KEY = "daokong-v1";

export function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)); } catch { return null; }
}
export function saveLocal(state) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch { /* storage blocked or full */ }
}

let ref = null;            // DocumentReference once connected
let pending = null, timer = null, chain = Promise.resolve();
let onError = () => {};

export function isSynced() { return !!ref; }
export function setErrorHandler(fn) { onError = fn; }

function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: "timeout" }), ms))]);
}

/**
 * Connect to the artifact database. Resolves to:
 *   null      — no database here (plain web app, signed out, or not granted): keep using localStorage only
 *   undefined — connected, but nothing saved there yet
 *   object    — the saved state
 */
export async function connect() {
  if (!(window.claude && window.claude.use)) return null;
  const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
  if (!db || !user) return null;
  const id = await user.id();
  if (!id) return null;
  const doc = db.collection("data/users/" + id).doc("state");
  const snap = await withTimeout(doc.get(), 10000);
  ref = doc;
  return snap.exists ? (snap.data() || {}).state : undefined;
}

/** Read the saved state again (e.g. when the app comes back to the foreground). */
export async function pull() {
  if (!ref) return null;
  const snap = await withTimeout(ref.get(), 10000);
  return snap.exists ? (snap.data() || {}).state : undefined;
}

/** Queue a write; bursts of changes become one write, and writes never overlap. */
export function saveRemote(state, delay = 800) {
  if (!ref) return;
  pending = state;
  clearTimeout(timer);
  timer = setTimeout(flush, delay);
}

export function flush() {
  clearTimeout(timer);
  if (!ref || !pending) return chain;
  const body = JSON.parse(JSON.stringify(pending));
  pending = null;
  chain = chain
    .then(() => ref.set({ state: body, savedAt: Date.now() }))
    .catch((e) => onError(e));
  return chain;
}
