# Mehfil Event Planners – Wedding Survey

**Live site:** https://YOUR-USERNAME.github.io/mehfil-survey/
**Repository:** https://github.com/YOUR-USERNAME/mehfil-survey

<!-- Replace YOUR-USERNAME (and the repo name if different) with the real values before submitting. -->

## Overview

A multi-step wedding preferences survey for Mehfil Event Planners, built with plain HTML, CSS and JavaScript. No frameworks, no build step, no server.

- Four steps: Couple and contact → Wedding details → Style, services and notes → Review and submit
- Progress bar with step label, percentage and numbered step dots
- Save and resume: answers are stored in the visitor's browser (`localStorage`), so they can close the page and continue later
- Live, accessible validation for required fields
- Review screen with Edit buttons for each section
- Submit sends the answers as JSON to a **mock API** (JSONPlaceholder). Nothing is delivered to the business yet
- Responsive layout (phones and desktops) and automatic light/dark colour scheme

## Installation

Requirements: any modern browser (Chrome, Edge, Firefox, Safari). Git is needed only to clone the repository.

```bash
git clone https://github.com/YOUR-USERNAME/mehfil-survey.git
cd mehfil-survey
```

There is nothing to install or build.

## Usage

**Run locally**

- Double-click `index.html`, **or**
- Start a small local server and open http://localhost:8000:

  ```bash
  python3 -m http.server 8000
  ```

**Use the survey**

1. Fill in the fields marked `*` and click **Next** on each step.
2. On step 4, check the answers. Use **Edit** to change a section, then **Next** to return.
3. Click **Submit**. A thank-you message with a reference number appears.
4. Use **Clear saved answers** to remove the saved data from the current device.

An internet connection is needed for Google Fonts and for Submit. Without it the survey still works and Submit shows an error.

**Project structure**

```
├── index.html   Page layout and the four steps
├── style.css    Look and layout
├── schema.js    Data model for the answers
├── storage.js   localStorage save / load / clear
├── app.js       Navigation, validation, review, submit
├── bg.svg       Background picture
├── LICENSE      MIT licence
├── HANDOVER.md  Hand-over note for the client
└── README.md    This file
```

Script order in `index.html` matters: `schema.js`, `storage.js`, then `app.js`.

## Deployment

The site is hosted with **GitHub Pages** from the `main` branch, root folder (`/`).

**First-time setup**

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit: Mehfil wedding survey"
git remote add origin https://github.com/YOUR-USERNAME/mehfil-survey.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, folder `/ (root)` → Save.**
After about a minute the site is live at `https://YOUR-USERNAME.github.io/mehfil-survey/`.

**Updating the live site**

```bash
git add .
git commit -m "Describe your change"
git push
```

GitHub Pages redeploys automatically after each push to `main`.

**Going live with real submissions**

`app.js` sends answers to `SUBMIT_URL`, currently the mock API https://jsonplaceholder.typicode.com/posts. It accepts any POST and returns a fake `id`, so **nothing is stored or delivered**. Before real use, change `SUBMIT_URL` at the top of `app.js` to a real endpoint (a form service or your own backend). See `HANDOVER.md`.

## Maintenance notes

| To change | Edit |
|-----------|------|
| Colours and fonts | CSS variables at the top of `style.css` |
| Background picture | Replace `bg.svg`, or add `bg.jpg` next to `index.html` |
| Budget, style or service options | The `<select>`, radio and checkbox lists in `index.html` |
| Required fields | `required` attributes in `index.html` |
| Add a question | Add an input with `data-path="group.field"` in `index.html`, add the field in `createEmptyAnswers()` in `schema.js`, optionally add a row to `REVIEW_SECTIONS` in `app.js` |
| Submit address | `SUBMIT_URL` and `SUBMIT_TIMEOUT_MS` in `app.js` |
| Saved-data format | `STORAGE_KEY` and `SCHEMA_VERSION` in `schema.js` (bump the version if the structure changes) |

## Privacy note

Until a visitor submits, answers exist only in their own browser and are not encrypted. Do not add password or payment fields to this survey.

## License

Released under the [MIT License](LICENSE).
