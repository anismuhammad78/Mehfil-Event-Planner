/* storage.js - read, write and clear the survey in localStorage. */

"use strict";

/* Write the whole state object. Returns true on success, false if blocked or full. */
function saveState(state) {
  try {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn("Could not save survey:", err);
    return false;
  }
}

/* Read the saved state. Returns null if nothing usable is stored. */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object" || saved.version !== SCHEMA_VERSION) {
      return null;                                   // unknown or older format
    }

    // Copy saved values onto a fresh schema so missing or wrong-typed fields never break the form.
    const fresh = createEmptyState();
    const savedAnswers = saved.answers && typeof saved.answers === "object" ? saved.answers : {};

    for (const group in fresh.answers) {
      const savedGroup = savedAnswers[group];
      if (!savedGroup || typeof savedGroup !== "object") continue;

      for (const key in fresh.answers[group]) {
        const expected = fresh.answers[group][key];
        const value = savedGroup[key];

        if (Array.isArray(expected)) {
          if (Array.isArray(value)) fresh.answers[group][key] = value.map(String);
        } else if (typeof value === "string") {
          fresh.answers[group][key] = value;
        }
      }
    }

    const step = Number(saved.currentStep);
    fresh.currentStep = Number.isInteger(step) && step >= 0 ? step : 0;
    fresh.updatedAt = typeof saved.updatedAt === "string" ? saved.updatedAt : null;
    return fresh;
  } catch (err) {
    console.warn("Saved survey was unreadable:", err);   // corrupted JSON or storage blocked
    return null;
  }
}

/* Delete the saved survey. */
function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Could not clear survey:", err);
  }
}

/* True if the user has typed, picked or moved past step 1. */
function hasProgress(state) {
  if (state.currentStep > 0) return true;
  return Object.values(state.answers).some(group =>
    Object.values(group).some(value => (Array.isArray(value) ? value.length > 0 : value !== ""))
  );
}
