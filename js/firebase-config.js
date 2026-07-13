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
 apiKey: "AIzaSyAWtAFLguFhl0fGtyeNkNW6v_6Bp7r66jg",
    authDomain: "exam-portal-7889a.firebaseapp.com",
    projectId: "exam-portal-7889a",
    storageBucket: "exam-portal-7889a.firebasestorage.app",
    messagingSenderId: "372720311233",
    appId: "1:372720311233:web:3b7776bb66db1d3f5ead40",
    measurementId: "G-HK4P9DCDB2"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
