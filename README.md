# Pariksha Portal — Student Exam Application System

A practice project to learn **HTML + CSS + JavaScript + AngularJS**, wired to a
real backend (**Firebase**) and deployed on **GitHub Pages**.

Students register, log in, fill an exam application, and track its status.
Admins log in to a separate dashboard to approve or reject applications.

## What's inside

```
exam-portal/
├── index.html              landing page
├── login.html               login (student or admin)
├── register.html            create account, choose role
├── student-dashboard.html   apply for exam + see your application status
├── admin-dashboard.html     review / approve / reject all applications
├── css/style.css            all styling
├── js/
│   ├── firebase-config.js   your Firebase project keys (you fill this in)
│   ├── services.js          AngularJS services wrapping Firebase calls
│   └── controllers.js       one controller per page
└── README.md
```

No build tools, no npm install — every file is loaded directly in the
browser via `<script>` tags (AngularJS and Firebase both come from a CDN).
That's what makes this deployable as-is on GitHub Pages.

## Step 1 — Create a Firebase project (free)

1. Go to https://console.firebase.google.com and create a new project.
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
3. **Build → Firestore Database → Create database** → start in **test mode**
   (we'll lock it down properly in Step 3).
4. **Project settings (gear icon) → General → Your apps → Add app → Web**.
   Firebase will show you a `firebaseConfig` object.
5. Copy that object into `js/firebase-config.js`, replacing the placeholder
   values.

## Step 2 — Run it locally

Since it's plain HTML/JS, you can't just double-click the files (browsers
block some features on `file://` URLs). Serve the folder locally instead:

```bash
cd exam-portal
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

Try it end-to-end:
1. Register a **student** account → you land on the student dashboard.
2. Submit an application.
3. Register a **second** account, this time choosing **Admin** → you land
   on the admin dashboard and see the application you just submitted.
4. Approve or reject it, then log back in as the student to see the status
   update.

## Step 3 — Lock down Firestore (important before real use)

Test mode leaves your database wide open. Once things work, go to
**Firestore Database → Rules** and replace them with something like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /applications/{appId} {
      allow create: if request.auth != null
                    && request.resource.data.studentUid == request.auth.uid;
      allow read: if request.auth != null;
      allow update: if request.auth != null; // tighten to admin-only once
                                              // you add custom claims
    }
  }
}
```

This is a simplified starting point — good enough for a learning project.
A production system would check the user's `role` via Firestore custom
claims rather than trusting the client, but that's a good "phase 2" topic
once the basics click.

## Step 4 — Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Exam portal — initial scaffold"
git branch -M main
git remote add origin https://github.com/<your-username>/exam-portal.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source → Deploy from branch → main →
/ (root)**. Your site will be live at
`https://<your-username>.github.io/exam-portal/`.

⚠️ Your `firebaseConfig` values will be publicly visible in the page
source once deployed — this is normal and expected for Firebase web apps
(it's not a secret key; access is controlled by the Firestore rules above,
not by hiding the config).

## Concepts this project is built to teach

- **AngularJS**: `ng-model` two-way binding, `ng-repeat`, `ng-if`/`ng-show`,
  `ng-click`, custom `factory` services, dependency injection, `$q` promise
  wrapping, `$watch`.
- **Firebase Auth**: email/password sign-up, sign-in, session persistence
  via `onAuthStateChanged`.
- **Firestore**: documents, collections, `where()` queries, `add()`,
  `update()`, server timestamps.
- **Real app structure**: separating services (data access) from
  controllers (page logic) from views (HTML) — the same separation of
  concerns you'll find in modern frameworks like React or Angular 2+.

## A note on AngularJS itself

AngularJS (1.x — the `ng-app` / `ng-controller` style used here) reached
end-of-life in January 2022 and is no longer maintained by Google. It's a
great way to *learn* the underlying concepts (two-way binding, DI,
directives, MVC structure), and those concepts carry over directly to
modern Angular, React, and Vue. But for a resume project meant to show
current skills, plan on eventually redoing the same app in modern Angular
or React once these fundamentals feel solid.

## Next steps once this works

- Add client-side validation feedback (AngularJS form states: `$dirty`,
  `$invalid`, `ngMessages`).
- Add pagination / search on the admin table.
- Generate a printable admit card (with roll number) once an application
  is approved.
- Add a "School Management" module (students, teachers, classes) as a
  second, related project reusing the same Auth/Firestore pattern.
