/* app.js - step navigation, progress bar, form <-> object sync, validation, save and resume,
   review screen with Edit buttons, and mock submit. */

"use strict";

const form = document.getElementById("survey");
const steps = [...document.querySelectorAll("#steps .step")];
const stepperItems = [...document.querySelectorAll("#stepper li")];
const track = document.getElementById("track");
const bar = document.getElementById("bar");
const stepLabel = document.getElementById("stepLabel");
const percentLabel = document.getElementById("percentLabel");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const clearBtn = document.getElementById("clearBtn");
const resumeNote = document.getElementById("resumeNote");
const saveStatus = document.getElementById("saveStatus");
const errorMsg = document.getElementById("errorMsg");
const reviewList = document.getElementById("reviewList");
const successPanel = document.getElementById("successPanel");
const successText = document.getElementById("successText");
const restartBtn = document.getElementById("restartBtn");
const surveyParts = [document.querySelector(".progress"), saveStatus, form];   // hidden after a successful submit
const topOfCard = document.getElementById("top");

/* Review screen: one section per survey step. Each row is [label, data-path].
   The section title is read from the step's data-title in index.html. */
const REVIEW_SECTIONS = [
  { step: 0, rows: [
    ["Partner 1", "couple.partner1Name"],
    ["Partner 2", "couple.partner2Name"],
    ["Email", "couple.email"],
    ["Phone", "couple.phone"]
  ] },
  { step: 1, rows: [
    ["Wedding date", "wedding.date"],
    ["Guests", "wedding.guests"],
    ["Venue or city", "wedding.venue"],
    ["Budget", "wedding.budget"]
  ] },
  { step: 2, rows: [
    ["Style", "preferences.style"],
    ["Services", "preferences.services"],
    ["Colours or theme", "preferences.colors"],
    ["Notes", "notes.requests"]
  ] }
];

/* Free mock API: JSONPlaceholder accepts any POST and answers 201 with the
   data you sent plus a fake id. Nothing is really stored or delivered. */
const SUBMIT_URL = "https://jsonplaceholder.typicode.com/posts";
const SUBMIT_TIMEOUT_MS = 10000;
let isSubmitting = false;

let state = loadState() || createEmptyState();

/* ---------- helpers for "group.field" paths ---------- */

function fields() {
  return [...form.querySelectorAll("[data-path]")];
}

function fieldsFor(path) {
  return fields().filter(el => el.dataset.path === path);
}

function splitPath(path) {
  return path.split(".");
}

function getAnswer(path) {
  const [group, key] = splitPath(path);
  return state.answers[group][key];
}

/* ---------- form <-> state ---------- */

/* Read every control into state.answers. */
function collectAnswers() {
  const checkboxes = {};
  const radios = {};

  fields().forEach(el => {
    const path = el.dataset.path;
    const [group, key] = splitPath(path);

    if (el.type === "checkbox") {
      checkboxes[path] = checkboxes[path] || [];
      if (el.checked) checkboxes[path].push(el.value);
    } else if (el.type === "radio") {
      if (!(path in radios)) radios[path] = "";
      if (el.checked) radios[path] = el.value;
    } else {
      state.answers[group][key] = el.value.trim();
    }
  });

  for (const path in checkboxes) {
    const [group, key] = splitPath(path);
    state.answers[group][key] = checkboxes[path];
  }
  for (const path in radios) {
    const [group, key] = splitPath(path);
    state.answers[group][key] = radios[path];
  }
}

/* Push state.answers into every control (pre-fill). */
function fillForm() {
  fields().forEach(el => {
    const value = getAnswer(el.dataset.path);

    if (el.type === "checkbox") el.checked = value.includes(el.value);
    else if (el.type === "radio") el.checked = value === el.value;
    else el.value = value;
  });
}

/* ---------- saving ---------- */

function saveNow() {
  collectAnswers();
  const ok = saveState(state);
  saveStatus.textContent = ok
    ? "Saved at " + new Date().toLocaleTimeString()
    : "Could not save in this browser. Your answers will be lost if you close the page.";
  return ok;
}

/* ---------- validation ---------- */

function clearError() {
  errorMsg.textContent = "";
  fields().forEach(el => el.removeAttribute("aria-invalid"));
}

/* Returns the first invalid required field inside the given step, or null. */
function firstInvalidIn(stepIndex) {
  const required = [...steps[stepIndex].querySelectorAll("[required]")];
  return required.find(el => pathError(el.dataset.path)) || null;   // group-aware: one checked box or radio is enough
}

function showFieldError(el) {
  el.setAttribute("aria-invalid", "true");
  errorMsg.textContent = el.type === "email" && el.value.trim()
    ? "Enter a valid email address."
    : "Fill in the required fields marked with *.";
  el.focus();
}

/* ---------- review screen (step 4) ---------- */

/* Build the review page from state.answers (the live copy of what is saved
   in localStorage): one section per step, each with an Edit button and a
   <ul> of <li> rows. */
function renderReview() {
  reviewList.textContent = "";

  REVIEW_SECTIONS.forEach(section => {
    const title = steps[section.step].dataset.title;

    const block = document.createElement("section");
    block.className = "review-section";

    const head = document.createElement("div");
    head.className = "review-head";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit-btn";
    edit.textContent = "Edit";
    edit.dataset.editStep = String(section.step);
    edit.setAttribute("aria-label", "Edit " + title);
    edit.disabled = isSubmitting;

    head.append(heading, edit);

    const list = document.createElement("ul");
    list.className = "review-list";

    section.rows.forEach(([label, path]) => {
      const text = displayValue(path, getAnswer(path));

      const item = document.createElement("li");
      item.className = "row";

      const name = document.createElement("span");
      name.className = "label";
      name.textContent = label;

      const value = document.createElement("span");
      value.className = text ? "value" : "value empty";
      value.textContent = text || "Not answered";

      item.append(name, value);
      list.append(item);
    });

    block.append(head, list);
    reviewList.append(block);
  });
}

/* Edit buttons: save what is typed, set the current step index and show
   that step (pre-filled). Use Next to come back to the review. */
reviewList.addEventListener("click", event => {
  const btn = event.target.closest("[data-edit-step]");
  if (!btn || isSubmitting) return;

  collectAnswers();
  showStep(Number(btn.dataset.editStep), true);
  saveNow();
  refreshNextButton();
});

/* ---------- progress bar ---------- */

/* Update the bar width, percent, label and step dots for the current step. */
function updateProgress() {
  const total = steps.length;
  const current = state.currentStep;
  const percent = Math.round(((current + 1) / total) * 100);

  bar.style.width = percent + "%";
  track.setAttribute("aria-valuenow", String(percent));
  track.setAttribute("aria-valuetext", "Step " + (current + 1) + " of " + total);

  stepLabel.textContent = "Step " + (current + 1) + " of " + total + ": " + steps[current].dataset.title;
  percentLabel.textContent = percent + "%";

  stepperItems.forEach((item, n) => {
    item.classList.toggle("is-current", n === current);
    item.classList.toggle("is-done", n < current);
    item.querySelector(".dot").textContent = n < current ? "\u2713" : String(n + 1);

    if (n === current) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
}

/* ---------- navigation ---------- */

/* Show one step and hide the others. Pass scroll = true after a button click. */
function showStep(index, scroll = false) {
  state.currentStep = Math.max(0, Math.min(index, steps.length - 1));
  const last = state.currentStep === steps.length - 1;

  steps.forEach((section, n) => { section.hidden = n !== state.currentStep; });

  backBtn.disabled = state.currentStep === 0;
  nextBtn.textContent = last ? "Submit" : "Next";

  updateProgress();
  if (last) renderReview();
  clearError();

  if (scroll) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topOfCard.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
}

nextBtn.addEventListener("click", () => {
  collectAnswers();
  clearError();

  const last = state.currentStep === steps.length - 1;

  if (!last) {
    const bad = firstInvalidIn(state.currentStep);
    if (bad) {
      saveNow();                                  // keep what they typed even if incomplete
      showFieldError(bad);
      return;
    }
    showStep(state.currentStep + 1, true);
    saveNow();                                    // saves answers and the new step number
    return;
  }

  // Submit: make sure every earlier step is complete.
  for (let i = 0; i < steps.length - 1; i++) {
    const bad = firstInvalidIn(i);
    if (bad) {
      showStep(i, true);
      saveNow();
      showFieldError(bad);
      return;
    }
  }
  saveNow();
  submitSurvey();                                 // POST to the mock API (see TASK 4 below)
});

backBtn.addEventListener("click", () => {
  collectAnswers();
  showStep(state.currentStep - 1, true);
  saveNow();
});

/* ---------- extra safety saves ---------- */

form.addEventListener("input", () => {
  saveNow();
});

form.addEventListener("change", saveNow);

function saveIfProgress() {
  collectAnswers();
  if (hasProgress(state)) saveState(state);       // do not re-create data right after "Clear"
}

window.addEventListener("beforeunload", saveIfProgress);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveIfProgress();
});

/* ---------- clear ---------- */

clearBtn.addEventListener("click", () => {
  if (!window.confirm("Clear all saved answers from this device?")) return;

  clearState();
  state = createEmptyState();
  form.reset();
  fillForm();
  showStep(0);
  resumeNote.hidden = true;
  saveStatus.textContent = "Saved answers cleared.";
});

/* ---------- start: resume if something was saved ---------- */

fillForm();
showStep(state.currentStep);

if (state.updatedAt && hasProgress(state)) {
  resumeNote.hidden = false;
  resumeNote.textContent =
    "Welcome back! We restored your answers from " +
    new Date(state.updatedAt).toLocaleString() +
    ". You are on step " + (state.currentStep + 1) + " of " + steps.length + ".";
  saveStatus.textContent = "Saved answers restored from this device.";
} else {
  saveStatus.textContent = "Your answers will be saved as you go.";
}

/* =========================================================================
   TASK 3 — Accessible live validation for required fields
   -------------------------------------------------------------------------
   Nothing above this line was changed. This section only ADDS behaviour:

     - it reads the required fields straight from the `[required]`
       attributes already in index.html (one step at a time)
     - `pathError()` is the validation function: it returns "" when a
       field is fine, or the message to show otherwise
     - `errorSlotFor()` inserts one <span class="field-error"> right after
       each required input (inside its own <label>, so the two-column
       grid in style.css is not affected), linked to the field with
       aria-describedby
     - blur / input / change on a required field repaint its message and
       re-check whether Next/Finish may be enabled
     - the message only appears once a field has been "touched" (left at
       least once), so the form does not look broken the moment it loads

   The existing validation above (firstInvalidIn / showFieldError) still
   runs exactly as before and is left as a safety net for Finish, which
   re-checks every earlier step.
   ========================================================================= */

const touchedPaths = new Set();

/* All form controls that share one data-path (a radio/checkbox group has
   more than one element for the same path). */
function elementsForPath(path) {
  return fields().filter(el => el.dataset.path === path);
}

/* The distinct data-path values marked `required` inside one step. */
function requiredPathsIn(stepIndex) {
  const paths = new Set();
  steps[stepIndex].querySelectorAll("[required]").forEach(el => paths.add(el.dataset.path));
  return [...paths];
}

/* Pure check for one required path: "" when it is filled in correctly,
   otherwise the message to show the visitor. */
function pathError(path) {
  const els = elementsForPath(path);
  const sample = els[0];

  if (sample.type === "radio") {
    return els.some(el => el.checked) ? "" : "Please choose one option.";
  }
  if (sample.type === "checkbox") {
    return els.some(el => el.checked) ? "" : "Please choose at least one option.";
  }

  if (!sample.value.trim()) return "This field is required.";

  if (!sample.checkValidity()) {
    if (sample.type === "email") return "Enter a valid email address.";
    if (sample.type === "number") return "Enter a number between " + sample.min + " and " + sample.max + ".";
    if (sample.type === "date") return "Enter a valid date.";
    return "Please enter a valid value.";
  }

  return "";
}

/* Find (or create) the element that carries the message for a path, and
   wire every control that shares that path to it with aria-describedby.
   Text fields get their message right inside their own <label>, straight
   after the input. Radio/checkbox groups get one shared message at the
   end of their .group container instead of one per option. */
function errorSlotFor(path) {
  const els = elementsForPath(path);
  const sample = els[0];
  const isChoice = sample.type === "radio" || sample.type === "checkbox";
  const host = isChoice ? sample.closest(".group") : sample;

  let slot = isChoice
    ? host.querySelector(":scope > .field-error")
    : (host.nextElementSibling && host.nextElementSibling.classList.contains("field-error")
        ? host.nextElementSibling
        : null);

  if (!slot) {
    slot = document.createElement("span");
    slot.className = "field-error";
    slot.setAttribute("aria-live", "polite");
    if (isChoice) host.appendChild(slot);
    else host.insertAdjacentElement("afterend", slot);
  }

  if (!slot.id) slot.id = "err-" + path.replace(/\./g, "-");

  els.forEach(el => {
    const ids = new Set((el.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
    ids.add(slot.id);
    el.setAttribute("aria-describedby", [...ids].join(" "));
  });

  return slot;
}

/* Show (or clear) the message for one path. The message only becomes
   visible once the visitor has left that field at least once ("touched"),
   so nothing looks broken on a blank page. Returns true when valid. */
function paintPath(path) {
  const message = pathError(path);
  const slot = errorSlotFor(path);
  const show = touchedPaths.has(path);

  slot.textContent = show ? message : "";
  elementsForPath(path).forEach(el => el.setAttribute("aria-invalid", message ? "true" : "false"));

  return !message;
}

/* Check every required path in a step. With paint = true it also updates
   the on-screen messages; with paint = false (the default) it is a silent
   check, used to decide whether Next may be enabled. */
function stepPasses(stepIndex, paint = false) {
  let ok = true;
  requiredPathsIn(stepIndex).forEach(path => {
    const valid = paint ? paintPath(path) : !pathError(path);
    if (!valid) ok = false;
  });
  return ok;
}

/* Keep the Next/Finish button disabled while the visible step has an
   unfixed required field. */
function refreshNextButton() {
  nextBtn.disabled = isSubmitting || !stepPasses(state.currentStep);
}

/* Wire live validation to every field that is actually required. */
[...form.querySelectorAll("[required]")].forEach(el => {
  const path = el.dataset.path;

  el.addEventListener("blur", () => {
    touchedPaths.add(path);
    paintPath(path);
    refreshNextButton();
  });

  el.addEventListener("input", () => {
    if (touchedPaths.has(path)) paintPath(path);
    refreshNextButton();
  });

  el.addEventListener("change", () => {
    if (touchedPaths.has(path)) paintPath(path);
    refreshNextButton();
  });
});

/* Radio and checkbox groups only carry `required` on their first option, so
   the per-field listeners above miss a click on any other option. Watch the
   whole form so Next/Finish re-enables (and a shown message clears) then too. */
form.addEventListener("change", event => {
  const path = event.target.dataset && event.target.dataset.path;
  if (path && touchedPaths.has(path) && requiredPathsIn(state.currentStep).includes(path)) paintPath(path);
  refreshNextButton();
});

/* Re-sync after the existing Next/Back handlers above have run: they may
   move to a new step (whose Next state needs recomputing), and on Finish
   they may flag an earlier field invalid themselves (showFieldError) —
   if so, treat that field as touched too so its message shows inline as
   well as in the summary message above the buttons. */
nextBtn.addEventListener("click", () => {
  const flagged = form.querySelector('[aria-invalid="true"]');
  if (flagged && flagged.dataset.path) touchedPaths.add(flagged.dataset.path);
  stepPasses(state.currentStep, true);
  refreshNextButton();
});

backBtn.addEventListener("click", () => {
  stepPasses(state.currentStep, true);
  refreshNextButton();
});

/* Only reset once the visitor actually confirmed the clear (the existing
   handler above returns early, without touching saveStatus, if they
   cancel the confirm dialog). */
clearBtn.addEventListener("click", () => {
  if (saveStatus.textContent !== "Saved answers cleared.") return;
  touchedPaths.clear();
  document.querySelectorAll(".field-error").forEach(slot => { slot.textContent = ""; });
  fields().forEach(el => el.removeAttribute("aria-invalid"));
  refreshNextButton();
});

/* Set the correct initial state once (covers both a fresh page and a
   resumed one, since fillForm()/showStep() above have already run). */
refreshNextButton();

/* =========================================================================
   TASK 4 — Mock submit
   -------------------------------------------------------------------------
   Submit (the Next button on the review step) first re-checks steps 1 to 3
   (existing Finish logic above), then calls submitSurvey():

     - postAnswers()  fetch POST of the answers as JSON to SUBMIT_URL
     - success        saved answers are cleared, the form is replaced by a
                      thank-you panel with the reference number
     - error          a red alert shows above the buttons; answers stay
                      saved so the visitor can press Submit again
   ========================================================================= */

/* Lock or unlock the controls while a request is in flight. */
function setSubmitting(on) {
  isSubmitting = on;
  const last = state.currentStep === steps.length - 1;

  nextBtn.textContent = on ? "Sending\u2026" : (last ? "Submit" : "Next");
  backBtn.disabled = on || state.currentStep === 0;
  clearBtn.disabled = on;
  reviewList.querySelectorAll("button").forEach(btn => { btn.disabled = on; });
  refreshNextButton();
}

/* POST the answers. Resolves with the server's JSON reply; rejects on a
   network error, a timeout, or a non-2xx status. */
async function postAnswers() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

  try {
    const response = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ submittedAt: new Date().toISOString(), answers: state.answers }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error("The server replied with status " + response.status + ".");
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function describeError(err) {
  if (err.name === "AbortError") return "The server took too long to respond.";
  if (err instanceof TypeError) return "Could not reach the server. Check your internet connection.";
  return err.message;
}

async function submitSurvey() {
  if (isSubmitting) return;
  setSubmitting(true);

  try {
    const reply = await postAnswers();
    showSuccess(reply);
  } catch (err) {
    errorMsg.textContent = "Submit failed. " + describeError(err) +
      " Your answers are still saved, so you can try again.";
  } finally {
    setSubmitting(false);
  }
}

/* Swap the form for the thank-you panel and reset everything for a new run. */
function showSuccess(reply) {
  const names = [state.answers.couple.partner1Name, state.answers.couple.partner2Name]
    .filter(Boolean).join(" & ");
  const ref = reply && reply.id ? " Reference number: #" + reply.id + "." : "";

  clearState();
  state = createEmptyState();
  form.reset();
  fillForm();
  touchedPaths.clear();
  document.querySelectorAll(".field-error").forEach(slot => { slot.textContent = ""; });
  clearError();
  showStep(0);

  surveyParts.forEach(el => { el.hidden = true; });
  resumeNote.hidden = true;

  successText.textContent = (names ? "Thank you, " + names + "! " : "Thank you! ") +
    "Your answers were submitted successfully." + ref +
    " (This was a test submission to a mock API.)";
  successPanel.hidden = false;
  successPanel.focus();
}

restartBtn.addEventListener("click", () => {
  successPanel.hidden = true;
  surveyParts.forEach(el => { el.hidden = false; });
  saveStatus.textContent = "Your answers will be saved as you go.";
  showStep(0, true);
  refreshNextButton();
});
