Plan to update the RetailEval application

1. Replace the logo source everywhere
- Copy the uploaded RetailEval professional logo image into `src/assets/`.
- Import it from `src/pages/Index.tsx` and use it for the navbar, footer, success screen, and any branded notification/track views.
- Update sizing styles so the uploaded logo displays clearly without cropping.

2. Add application tracking without a database
- Generate a unique application tracking code on successful submission, for example `RE-2026-XXXXXX`.
- Store the completed application status in `localStorage` only, since you do not want a database.
- Add a track application experience from the navbar/footer/hero where users can enter their tracking code and see:
  - Application Received
  - Submitted applicant name/email
  - Current review status
  - Next step message
  - Estimated text-message contact window: 24-48 hours
- Keep this browser-session based. Without a database, tracking will only work on the same browser/device where the user submitted the form.

3. Improve the success screen and final message
- Replace the current short success text with a professional confirmation panel including:
  - RetailEval logo
  - “Application Submitted Successfully”
  - Tracking code
  - Confirmation that an application specialist will review the submission
  - Message that an expert/interview coordinator may contact them by text message within 24-48 hours
  - Button to track application
  - Button to return home

4. Add email submission notification safely
- Do not put the Gmail address or app password directly in the React app. Client-side SMTP credentials would be exposed to visitors.
- Use a secure server-side email function instead. The Gmail SMTP details will be stored as secrets and used only on the backend/email function.
- Configure the notification email to go to the submitted applicant email address using a professional HTML template with the RetailEval logo, tracking code, applicant name, status, and 24-48 hour interview/text follow-up notice.
- Note: direct SMTP with rotating ports 465/587 cannot run safely from a browser-only app. It requires a backend/email function. If backend email infrastructure is not available, I will add a polished in-app confirmation and leave the email send as a secure integration point rather than exposing credentials.

5. Session and connection behavior
- Preserve progress and completed tracking state in `localStorage` so users can leave and return on the same browser.
- Avoid adding a fake persistent WebSocket unless there is a real backend to connect to. A WebSocket needs a server endpoint; this current app is client-side. Instead, I will make the tracking/status UX feel live with clear session persistence and status cards.

6. Visual polish
- Make the application and tracking screens more intense and premium while staying clean: stronger logo treatment, deeper glass cards, clearer success/tracking badges, and better mobile layout.
- Keep all text professional and remove anything that feels placeholder or generic.

Technical notes
- Main files to update: `src/pages/Index.tsx`, `src/index.css`, and the uploaded logo asset in `src/assets/`.
- If secure email sending is approved/available, add a backend/email function and store secrets outside the client bundle. I will not hardcode the Gmail app password in frontend code.