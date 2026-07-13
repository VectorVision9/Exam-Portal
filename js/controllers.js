/* =========================================================
   Controllers — one per page
   ========================================================= */

/* ---------- Register page ---------- */
app.controller('RegisterController', ['$scope', 'AuthService', function ($scope, AuthService) {
  $scope.form = { fullName: '', email: '', password: '' };
  $scope.error = '';
  $scope.loading = false;

  $scope.submit = function () {
    $scope.error = '';
    $scope.loading = true;
    // Everyone who self-registers is a student. Admin accounts are never
    // created through this public form — see README "Creating an admin
    // account" for how to promote a user manually in the Firebase console.
    AuthService.register($scope.form.email, $scope.form.password, $scope.form.fullName, 'student')
      .then(function () {
        window.location.href = 'student-dashboard.html';
      })
      .catch(function (err) {
        $scope.error = err.message;
      })
      .finally(function () { $scope.loading = false; });
  };
}]);

/* ---------- Login page ---------- */
app.controller('LoginController', ['$scope', 'AuthService', function ($scope, AuthService) {
  $scope.form = { email: '', password: '' };
  $scope.error = '';
  $scope.loading = false;

  $scope.submit = function () {
    $scope.error = '';
    $scope.loading = true;
    AuthService.login($scope.form.email, $scope.form.password)
      .then(function (user) {
        return AuthService.getUserProfile(user.uid);
      })
      .then(function (profile) {
        window.location.href = (profile && profile.role === 'admin') ? 'admin-dashboard.html' : 'student-dashboard.html';
      })
      .catch(function (err) {
        $scope.error = err.message;
      })
      .finally(function () { $scope.loading = false; });
  };
}]);

/* ---------- Student dashboard ---------- */
app.controller('StudentDashboardController', ['$scope', 'AuthService', 'ApplicationService',
  function ($scope, AuthService, ApplicationService) {

    $scope.loadingUser = true;
    $scope.applications = [];
    $scope.submitting = false;
    $scope.successMsg = '';
    $scope.error = '';

    $scope.exam = {
      examName: '',
      candidateName: '',
      fatherName: '',
      dob: '',
      category: 'General',
      mobile: ''
    };

    AuthService.getCurrentUser().then(function (user) {
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
      $scope.user = user;
      $scope.loadingUser = false;
      refreshApplications();
    });

    function refreshApplications() {
      ApplicationService.getApplicationsForStudent($scope.user.uid).then(function (apps) {
        $scope.applications = apps;
      });
    }

    $scope.submitApplication = function () {
      $scope.error = '';
      $scope.successMsg = '';
      $scope.submitting = true;

      const payload = angular.extend({}, $scope.exam, {
        studentUid: $scope.user.uid,
        studentEmail: $scope.user.email
      });

      ApplicationService.submitApplication(payload)
        .then(function () {
          $scope.successMsg = 'Application submitted. Roll number will be issued after approval.';
          $scope.exam = { examName: '', candidateName: '', fatherName: '', dob: '', category: 'General', mobile: '' };
          refreshApplications();
        })
        .catch(function (err) { $scope.error = err.message; })
        .finally(function () { $scope.submitting = false; });
    };

    $scope.logout = function () {
      AuthService.logout().then(function () { window.location.href = 'index.html'; });
    };
  }]);

/* ---------- Admit card ---------- */
app.controller('AdmitCardController', ['$scope', 'AuthService', 'ApplicationService',
  function ($scope, AuthService, ApplicationService) {

    $scope.loading = true;
    $scope.error = '';

    const params = new URLSearchParams(window.location.search);
    const appId = params.get('id');

    AuthService.getCurrentUser().then(function (user) {
      if (!user) { window.location.href = 'login.html'; return; }
      if (!appId) { $scope.error = 'No application specified.'; $scope.loading = false; return; }

      ApplicationService.getApplicationById(appId).then(function (application) {
        if (!application) {
          $scope.error = 'Application not found.';
        } else if (application.studentUid !== user.uid) {
          $scope.error = 'You do not have access to this admit card.';
        } else if (application.status !== 'approved') {
          $scope.error = 'This application has not been approved yet — no admit card issued.';
        } else {
          $scope.app = application;
        }
        $scope.loading = false;
      });
    });

    $scope.printCard = function () { window.print(); };
  }]);

/* ---------- Admin dashboard ---------- */
app.controller('AdminDashboardController', ['$scope', 'AuthService', 'ApplicationService',
  function ($scope, AuthService, ApplicationService) {

    $scope.loadingUser = true;
    $scope.applications = [];
    $scope.filterStatus = 'all';

    AuthService.getCurrentUser().then(function (user) {
      if (!user) { window.location.href = 'login.html'; return; }
      return AuthService.getUserProfile(user.uid).then(function (profile) {
        if (!profile || profile.role !== 'admin') {
          window.location.href = 'student-dashboard.html';
          return;
        }
        $scope.user = user;
        $scope.loadingUser = false;
        refreshApplications();
      });
    });

    function refreshApplications() {
      ApplicationService.getAllApplications().then(function (apps) {
        $scope.applications = apps;
      });
    }

    $scope.setStatus = function (application, status) {
      application._updating = true;
      const extra = {};
      // Issue a roll number the moment an application is approved.
      if (status === 'approved' && !application.rollNumber) {
        extra.rollNumber = ApplicationService.generateRollNumber();
      }
      ApplicationService.updateStatus(application.id, status, extra)
        .then(function () {
          application.status = status;
          if (extra.rollNumber) application.rollNumber = extra.rollNumber;
        })
        .finally(function () { application._updating = false; });
    };

    $scope.$watch('applications.length', function () {
      $scope.stats = {
        total: $scope.applications.length,
        pending: $scope.applications.filter(function (a) { return a.status === 'pending'; }).length,
        approved: $scope.applications.filter(function (a) { return a.status === 'approved'; }).length,
        rejected: $scope.applications.filter(function (a) { return a.status === 'rejected'; }).length
      };
    });

    $scope.logout = function () {
      AuthService.logout().then(function () { window.location.href = 'index.html'; });
    };
  }]);
