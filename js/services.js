/* =========================================================
   AngularJS module + services
   =========================================================
   Firebase's SDK returns native JS Promises. AngularJS doesn't
   know about those, so its digest cycle won't auto-refresh the
   view when they resolve. The fix used throughout this file:
   wrap every firebase promise with $q.when(...) so Angular's
   digest cycle picks up the change automatically.
   ========================================================= */

const app = angular.module('examPortal', []);

/* ---------- AuthService ---------- */
app.factory('AuthService', ['$q', function ($q) {

  function register(email, password, fullName, role) {
    return $q.when(
      auth.createUserWithEmailAndPassword(email, password)
        .then(function (cred) {
          // Store profile + role in Firestore, keyed by uid.
          // role is either 'student' or 'admin'.
          return db.collection('users').doc(cred.user.uid).set({
            fullName: fullName,
            email: email,
            role: role || 'student',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(function () { return cred.user; });
        })
    );
  }

  function login(email, password) {
    return $q.when(
      auth.signInWithEmailAndPassword(email, password).then(function (cred) {
        return cred.user;
      })
    );
  }

  function logout() {
    return $q.when(auth.signOut());
  }

  function getCurrentUser() {
    // Resolves once Firebase has restored session state (or null).
    return $q(function (resolve) {
      const unsubscribe = auth.onAuthStateChanged(function (user) {
        unsubscribe();
        resolve(user);
      });
    });
  }

  function getUserProfile(uid) {
    return $q.when(
      db.collection('users').doc(uid).get().then(function (doc) {
        return doc.exists ? doc.data() : null;
      })
    );
  }

  return {
    register: register,
    login: login,
    logout: logout,
    getCurrentUser: getCurrentUser,
    getUserProfile: getUserProfile
  };
}]);

/* ---------- ApplicationService ---------- */
app.factory('ApplicationService', ['$q', function ($q) {

  function submitApplication(data) {
    return $q.when(
      db.collection('applications').add(angular.extend({}, data, {
        status: 'pending',
        appliedAt: firebase.firestore.FieldValue.serverTimestamp()
      }))
    );
  }

  function getApplicationsForStudent(uid) {
    return $q.when(
      db.collection('applications').where('studentUid', '==', uid)
        .get().then(function (snap) {
          const out = [];
          snap.forEach(function (doc) { out.push(angular.extend({ id: doc.id }, doc.data())); });
          return out;
        })
    );
  }

  function getAllApplications() {
    return $q.when(
      db.collection('applications').orderBy('appliedAt', 'desc')
        .get().then(function (snap) {
          const out = [];
          snap.forEach(function (doc) { out.push(angular.extend({ id: doc.id }, doc.data())); });
          return out;
        })
    );
  }

  function updateStatus(appId, status) {
    return $q.when(
      db.collection('applications').doc(appId).update({ status: status })
    );
  }

  return {
    submitApplication: submitApplication,
    getApplicationsForStudent: getApplicationsForStudent,
    getAllApplications: getAllApplications,
    updateStatus: updateStatus
  };
}]);
