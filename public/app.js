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
function connect() {
  const source = new EventSource(`/api/marks/stream?after=${lastId}`);
  source.addEventListener("open", () => {
    liveState.textContent = "live — strokes from other hands appear as they're added.";
  });
  source.addEventListener("mark", (event) => {
    const mark = JSON.parse(event.data);
    if (insertMark(mark) && !mark.yours) {
      if (held) held.push(mark);
      else announceStrokes([mark]);
    }
    updateWelcome();
  });
  source.addEventListener("error", () => {
    liveState.textContent = "reconnecting — anything added meanwhile will arrive when it's back.";
    if (source.readyState === EventSource.CLOSED) setTimeout(connect, 5000);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const color = new FormData(form).get("color");
  const note = noteInput.value;

  statusEl.textContent = "adding your mark…";
  let res;
  held = [];
  try {
    res = await fetch("/api/marks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ color, note }),
    });
  } catch {
    releaseHeld(null);
    statusEl.textContent = "that mark couldn't be added — check your connection and try again.";
    return;
  }

  if (!res.ok) {
    releaseHeld(null);
    statusEl.textContent = "that mark couldn't be added — try a shorter note.";
    return;
  }

  noteInput.value = "";
  statusEl.textContent = "added to the scroll.";
  const { mark } = await res.json();
  insertMark(mark);
  releaseHeld(mark.id);
  updateWelcome();
});

buildPalette();
// The stream opens only after the load, from the last id it rendered, so the
// two never disagree about where the scroll was when this tab arrived.
load().then((loaded) => {
  if (!loaded) {
    liveState.textContent = "not live — reload to try again.";
    return;
  }
  if ("EventSource" in window) connect();
  else liveState.textContent = "this browser can't receive live strokes — reload to see new ones.";
});
