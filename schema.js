/* schema.js - the data model for every survey answer.

   Steps:  0 Couple and contact | 1 Wedding details | 2 Style, services and notes
   Keys below match the data-path="group.field" attributes in index.html.

   Saved JSON looks like this:
   {
     "version": 1,
     "currentStep": 1,
     "updatedAt": "2026-09-29T10:15:00.000Z",
     "answers": {
       "couple":      { "partner1Name": "", "partner2Name": "", "email": "", "phone": "" },
       "wedding":     { "date": "", "guests": "", "venue": "", "budget": "" },
       "preferences": { "style": "", "services": [], "colors": "" },
       "notes":       { "requests": "" }
     }
   }
*/

"use strict";

const STORAGE_KEY = "mehfilSurvey.v1";
const SCHEMA_VERSION = 1;

/* Fields the user must fill in before moving on. This list is for
   reference only — app.js actually reads the `required` attribute
   straight from index.html, so update both places together. */
const REQUIRED_PATHS = [
  "couple.partner1Name",
  "couple.partner2Name",
  "couple.email",
  "wedding.date",
  "wedding.guests",
  "wedding.venue",
  "wedding.budget",
  "preferences.style",
  "preferences.services",
  "preferences.colors"
];

/* Blank answers, grouped by step. */
function createEmptyAnswers() {
  return {
    couple:      { partner1Name: "", partner2Name: "", email: "", phone: "" },   // step 0
    wedding:     { date: "", guests: "", venue: "", budget: "" },               // step 1
    preferences: { style: "", services: [], colors: "" },                       // step 2
    notes:       { requests: "" }                                               // step 2
  };
}

/* The full saved record: answers + where the user was + when it was saved. */
function createEmptyState() {
  return {
    version: SCHEMA_VERSION,
    currentStep: 0,
    updatedAt: null,
    answers: createEmptyAnswers()
  };
}
