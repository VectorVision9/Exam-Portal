/* =========================================================
   Controllers — one per page
   ========================================================= */

/* ---------- Register page ---------- */
app.controller('RegisterController', ['$scope', 'AuthService', function ($scope, AuthService) {
  $scope.form = { fullName: '', email: '', password: '', role: 'student' };
  $scope.error = '';
  $scope.loading = false;

  $scope.submit = function () {
    $scope.error = '';
    $scope.loading = true;
    AuthService.register($scope.form.email, $scope.form.password, $scope.form.fullName, $scope.form.role)
      .then(function () {
        window.location.href = $scope.form.role === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html';
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
      ApplicationService.updateStatus(application.id, status)
        .then(function () { application.status = status; })
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
// Add these functions inside your AngularJS controller

// --- CSV Export Logic ---
$scope.exportToCSV = function() {
    let data = $scope.applications; 
    
    if (!data || data.length === 0) {
        alert("No data available to export!");
        return;
    }

    // 1. Get the headers from the keys of the first object in your array
    let headers = Object.keys(data[0]);
    
    // 2. Format headers for the top row of the CSV
    let csvContent = headers.join(",") + "\n";

    // 3. Loop through $scope.applications and format each row
    data.forEach(function(row) {
        let rowString = headers.map(function(key) {
            // Handle null/undefined values safely
            let cellValue = row[key] === null || row[key] === undefined ? "" : String(row[key]);
            // Escape quotes and wrap in quotes so commas in the text don't break the layout
            return '"' + cellValue.replace(/"/g, '""') + '"'; 
        }).join(",");
        
        csvContent += rowString + "\n";
    });

    // 4. Create the CSV file and trigger the browser download
    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement("a");
    let url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "exam_applications.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// --- PDF Export Logic ---
$scope.exportToPDF = function() {
    // Select your HTML table. This ensures the PDF looks exactly like your UI.
    const element = document.querySelector('table'); 
    
    if (!element) {
        alert("Table not found!");
        return;
    }

    // Configure the PDF settings
    const opt = {
      margin:       0.5,
      filename:     'exam_applications.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    // Generate and save the PDF using the html2pdf library
    html2pdf().set(opt).from(element).save();
};
