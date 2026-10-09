// Vanilla JS, no build step: this page is small enough that a bundler would
// be more machinery than the app itself.

// Mirrors src/marks.ts's PALETTE and order exactly; the server is the one
// that actually enforces membership, this just has to offer the same set.
const PALETTE = [
  { color: "#2b2118", name: "walnut" },
  { color: "#5b4636", name: "umber" },
  { color: "#8a6d3b", name: "ochre" },
  { color: "#3f5d40", name: "pine" },
  { color: "#3a5a6b", name: "slate" },
  { color: "#7a3b3b", name: "madder" },
];

const scrollList = document.getElementById("scroll");
const emptyNotice = document.getElementById("scroll-empty");
const welcomeBack = document.getElementById("welcome-back");
const form = document.getElementById("add-mark-form");
const paletteEl = form.querySelector(".palette");
const noteInput = document.getElementById("note");
const statusEl = document.getElementById("form-status");
const liveState = document.getElementById("live-state");
const announce = document.getElementById("scroll-announce");

// The highest stroke id on the page. Strokes only ever get appended with a
// higher id, so this is all a reconnecting stream needs to say what it missed.
let lastId = 0;
const rendered = new Map();
// While this tab's own post is in flight, its stroke can arrive on the stream
// first as someone else's. Stream arrivals wait here until the post answers
// with its id, so only strangers' strokes get announced.
let held = null;
// A warm machine can answer before a person's second click lands, which would
// then post the cleared form as a blank stroke; submits wait out this long
// after a post succeeds. A deliberate next stroke is never that quick.
const SETTLE_MS = 1000;
let settledAt = 0;

function buildPalette() {
  PALETTE.forEach(({ color, name }, i) => {
    const id = `color-${name}`;
    const label = document.createElement("label");
    label.className = "swatch";
    label.style.setProperty("--stroke", color);
    label.htmlFor = id;

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "color";
    input.id = id;
    input.value = color;
    if (i === 0) input.checked = true;

    const text = document.createElement("span");
    text.textContent = name;

    label.append(input, text);
    paletteEl.append(label);
  });
}

function timeLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function markToListItem(mark) {
  const li = document.createElement("li");
  li.className = "mark" + (mark.yours ? " mark--yours" : "");
  li.dataset.id = String(mark.id);

  const stroke = document.createElement("span");
  stroke.className = "mark__stroke";
  stroke.style.setProperty("--stroke", mark.color);
  stroke.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.className = "mark__text";
  const noteText = mark.note ? mark.note : "(a stroke, no note)";
  const yoursSuffix = mark.yours ? " — yours" : "";
  text.textContent = `${noteText} — ${timeLabel(mark.createdAt)}${yoursSuffix}`;

  li.append(stroke, text);
  return li;
}

// Only the load calls this: a stroke made or arriving during this visit isn't
// one the hand left "before".
function updateWelcome() {
  const ownCount = scrollList.querySelectorAll(".mark--yours").length;
  if (ownCount > 0) {
    welcomeBack.hidden = false;
    welcomeBack.textContent =
      ownCount === 1
        ? "You've left a mark on this scroll before — it's still there."
        : `You've left ${ownCount} marks on this scroll before — they're still there.`;
  }
}

// Strokes can reach the page three ways (the initial load, the stream, and
// the response to your own post) in any order, so each lands by id: once,
// and in the scroll's own order. A first-time visitor's stream opened before
// their hand existed, so it can deliver their own first stroke as someone
// else's; the post's own response, which knows better, replaces it.
function insertMark(mark) {
  const existing = rendered.get(mark.id);
  if (existing) {
    if (mark.yours && !existing.classList.contains("mark--yours")) {
      const li = markToListItem(mark);
      existing.replaceWith(li);
      rendered.set(mark.id, li);
    }
    return false;
  }
  emptyNotice.remove();
  const li = markToListItem(mark);
  // almost always the newest, so only an out-of-order arrival scans
  const later =
    mark.id > lastId
      ? null
      : [...scrollList.children].find((el) => Number(el.dataset.id) > mark.id);
  scrollList.insertBefore(li, later ?? null);
  rendered.set(mark.id, li);
  lastId = Math.max(lastId, mark.id);
  return true;
}

function announceStrokes(marks) {
  if (marks.length === 1) announce.textContent = `a new stroke: ${marks[0].note || "no note"}`;
  else if (marks.length > 1) announce.textContent = `${marks.length} new strokes`;
}

function releaseHeld(ownId) {
  announceStrokes(held.filter((mark) => mark.id !== ownId));
  held = null;
}

function render(marks) {
  scrollList.innerHTML = "";
  rendered.clear();
  if (marks.length === 0) {
    scrollList.append(emptyNotice);
    return;
  }
  for (const mark of marks) insertMark(mark);
  updateWelcome();
}

async function load() {
  // fly.toml stops this app's one machine when idle and starts it on the next
  // request, so a cold start (or any dropped connection) is a real, not
  // hypothetical, way for this fetch to reject rather than resolve.
  try {
    const res = await fetch("/api/marks");
    const data = await res.json();
    render(data.marks);
    return true;
  } catch {
    scrollList.innerHTML = "";
    const notice = document.createElement("li");
    notice.className = "scroll__empty";
    notice.textContent = "couldn't load the scroll — check your connection and try reloading.";
    scrollList.append(notice);
    return false;
  }
}

// EventSource retries a dropped connection by itself, sending Last-Event-ID
// so the server replays exactly what was missed. It gives up for good only
// when an attempt gets a non-200 answer (a redeploy, a cold start the proxy
// couldn't wait for), so that case reopens by hand from lastId.
//
// A connection can also die without either end saying so: a phone that slept
// through the server dropping it, a network switch with no reset. EventSource
// still reads OPEN and would say "live" while hearing nothing, so the page
// reopens any stream that has missed two of the server's pings.
const SILENCE_MS = 60_000;
let source = null;
let heardAt = 0;

function connect() {
  const own = new EventSource(`/api/marks/stream?after=${lastId}`);
  source = own;
  heardAt = Date.now();
  own.addEventListener("open", () => {
    heardAt = Date.now();
    liveState.textContent = "live — strokes from other hands appear as they're added.";
  });
  own.addEventListener("ping", () => {
    heardAt = Date.now();
  });
  own.addEventListener("mark", (event) => {
    heardAt = Date.now();
    const mark = JSON.parse(event.data);
    if (insertMark(mark) && !mark.yours) {
      if (held) held.push(mark);
      else announceStrokes([mark]);
    }
  });
  own.addEventListener("error", () => {
    liveState.textContent = "reconnecting — anything added meanwhile will arrive when it's back.";
    if (own.readyState === EventSource.CLOSED) setTimeout(connect, 5000);
  });
}

function reopenIfSilent() {
  if (source?.readyState !== EventSource.OPEN || Date.now() - heardAt <= SILENCE_MS) return;
  source.close();
  connect();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  // A double click or a second Enter mustn't leave the stroke twice on a
  // scroll that never forgets; held is set for exactly as long as a post is.
  if (held || Date.now() < settledAt) return;
  const color = new FormData(form).get("color");
  const note = noteInput.value;

  statusEl.textContent = "adding your mark…";
  let res;
  let mark;
  let error;
  held = [];
  try {
    res = await fetch("/api/marks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ color, note }),
    });
    if (res.ok) ({ mark } = await res.json());
    else if (res.status === 422) ({ error } = await res.json());
  } catch {
    releaseHeld(null);
    statusEl.textContent = "that mark couldn't be added — check your connection and try again.";
    return;
  }

  // Only the server's own verdict on the note blames it: the form's maxlength
  // matches the cap, so anything else is the server or Fly's proxy failing.
  if (!res.ok) {
    releaseHeld(null);
    statusEl.textContent =
      error === "note-too-long"
        ? "that mark couldn't be added — try a shorter note."
        : "the scroll couldn't take that mark just now — try again in a moment.";
    return;
  }

  settledAt = Date.now() + SETTLE_MS;
  noteInput.value = "";
  statusEl.textContent = "added to the scroll.";
  insertMark(mark);
  releaseHeld(mark.id);
});

buildPalette();
// The stream opens only after the load, from the last id it rendered, so the
// two never disagree about where the scroll was when this tab arrived.
load().then((loaded) => {
  if (!loaded) {
    liveState.textContent = "not live — reload to try again.";
    return;
  }
  if ("EventSource" in window) {
    connect();
    // a sleeping phone's timers barely run, so check again the moment it wakes
    setInterval(reopenIfSilent, 15_000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) reopenIfSilent();
    });
  } else liveState.textContent = "this browser can't receive live strokes — reload to see new ones.";
});
