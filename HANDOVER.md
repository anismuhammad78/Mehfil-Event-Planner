# Hand-over Note – Mehfil Event Planners Wedding Survey

**Prepared by:** Anis, Web Development Intern, EZItech Software House
**Client:** Mehfil Event Planners
**Live site:** https://YOUR-USERNAME.github.io/mehfil-survey/
**Repository:** https://github.com/YOUR-USERNAME/mehfil-survey

## 1. What is being delivered

A four-step wedding preferences survey (contact, wedding details, style and services, review and submit) hosted free on GitHub Pages. It has a progress bar, live validation, save-and-resume in the visitor's browser, a review screen with Edit buttons, and a mobile-friendly design.

## 2. Important: submissions are not delivered yet

The Submit button currently posts to a **test service** (JSONPlaceholder). It shows a thank-you message, but **no answers reach Mehfil Event Planners**. The survey must be connected to a real destination before it is shared with customers.

## 3. Next steps for the client

| Priority | Action | How |
|----------|--------|-----|
| 1 | Connect a real submission endpoint | Choose a form service (for example Formspree or Google Apps Script) or a small backend. Change `SUBMIT_URL` at the top of `app.js`. Send a test entry and confirm it arrives |
| 2 | Check the reply format | The page treats any 2xx reply as success. If the service returns a different reply, adjust `showSuccess()` in `app.js` |
| 3 | Review wording and options | Confirm budget ranges, style options, services and required fields with the team (`index.html`) |
| 4 | Add branding | Replace `bg.svg` with an official photo (`bg.jpg`) and confirm colours in `style.css` |
| 5 | Add a privacy notice | The survey collects names, email and phone. Add a short notice about how the data is used |
| 6 | Optional: custom domain | GitHub Settings → Pages → Custom domain, then add the DNS record at the domain provider |
| 7 | Optional: analytics | Add a privacy-friendly analytics script to see how many visitors finish the survey |

## 4. How to update the site

1. Edit the files (in a text editor or on GitHub with the pencil icon).
2. Commit and push to `main`.
3. GitHub Pages redeploys within a minute or two. Refresh the page (Ctrl+F5) to see changes.

## 5. Ownership and access

- Make sure the client organisation owns the GitHub repository, or transfer it under Settings → General → Transfer.
- Give named team members access under Settings → Collaborators.
- Use two-factor authentication on the GitHub account.

## 6. Known limits

- Saved answers live only in the visitor's browser. Clearing browser data or switching devices removes them.
- Google Fonts and the submit request need an internet connection.
- GitHub Pages serves static files only. It cannot store answers or send emails by itself.
- The Pages site is public. Do not put private information in the repository.

## 7. Support

For questions about this project, contact EZItech Software House.
