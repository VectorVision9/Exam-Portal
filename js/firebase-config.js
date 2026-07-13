/* =========================================================
   FIREBASE CONFIG
   =========================================================
   1. Go to https://console.firebase.google.com
   2. Create a new project (free "Spark" plan is enough)
   3. Project settings -> General -> "Your apps" -> Add app -> Web (</>)
   4. Copy the firebaseConfig object it gives you and paste it below
   5. In the left menu enable:
        - Build > Authentication > Sign-in method > Email/Password (enable it)
        - Build > Firestore Database > Create database (start in TEST mode
          for now — we'll tighten rules later, see README)
   ========================================================= */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
