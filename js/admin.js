document.addEventListener("DOMContentLoaded", () => {
  // Enforce session
  const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedUser || loggedUser.role !== "admin") {
    window.location.href = "login.html";
    return;
  }

  // Update Admin Identity in UI
  const adminNameEl = document.getElementById("admin-name-display");
  const adminRoleEl = document.getElementById("admin-role-display");
  const adminAvatarEl = document.getElementById("admin-avatar-display");
  
  if (adminNameEl) adminNameEl.textContent = loggedUser.name;
  if (adminRoleEl) adminRoleEl.textContent = loggedUser.email; // The prompt asked to display actual admin email
  if (adminAvatarEl) {
    // Generate initials: e.g., "Sarah Connor" -> "SC", "John" -> "JO"
    const nameParts = loggedUser.name.split(" ");
    let initials = "";
    if (nameParts.length > 1) {
      initials = nameParts[0].charAt(0) + nameParts[1].charAt(0);
    } else {
      initials = nameParts[0].substring(0, 2);
    }
    adminAvatarEl.textContent = initials.toUpperCase();
  }

  // Load administrative data from localStorage or fallback
  let adminStats = JSON.parse(localStorage.getItem("adminStats")) || JobSphereData.adminStats;
  let activeJobs = JSON.parse(localStorage.getItem("globalJobs")) || JobSphereData.jobs;
  
  // Sync globalJobs
  if (!localStorage.getItem("globalJobs")) {
    localStorage.setItem("globalJobs", JSON.stringify(JobSphereData.jobs));
  }

  // Mobile sidebar toggle
  const sidebar = document.getElementById("dashboard-sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle");
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("show");
    });
  }

  document.querySelectorAll(".sidebar-link").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 991.98 && sidebar) {
        sidebar.classList.remove("show");
      }
    });
  });

  // Toggling Views
  const links = document.querySelectorAll(".sidebar-link");
  links.forEach(link => {
    link.addEventListener("click", function(e) {
      e.preventDefault();
      
      const viewId = this.getAttribute("data-view");
      if (!viewId) return;

      links.forEach(l => l.classList.remove("active"));
      this.classList.add("active");

      document.querySelectorAll(".dashboard-view-panel").forEach(p => p.classList.add("d-none"));
      const targetPanel = document.getElementById(`panel-${viewId}`);
      if (targetPanel) targetPanel.classList.remove("d-none");

      if (viewId === "dashboard") {
        renderDashboardStats();
      } else if (viewId === "users") {
        renderUsersTable();
      } else if (viewId === "jobs") {
        renderJobsTable();
      }
    });
  });

  // 1. INITIALIZE DATA ON LOAD
  renderDashboardStats();
  renderUsersTable();
  renderJobsTable();

  // 2. INITIALIZE CHARTS
  let lineChart, pieChart;
  initAdminCharts();

  window.addEventListener('themeChanged', (e) => {
    const isDark = e.detail.isDark;
    updateAdminChartsTheme(isDark);
  });

  // 3. MANAGE USERS EVENT HANDLERS
  const addUserForm = document.getElementById("addUserForm");
  if (addUserForm) {
    addUserForm.addEventListener("submit", function(e) {
      e.preventDefault();
      
      if (!this.checkValidity()) {
        e.stopPropagation();
        this.classList.add("was-validated");
        return;
      }

      const name = document.getElementById("user-name-input").value.trim();
      const email = document.getElementById("user-email-input").value.trim();
      const role = document.getElementById("user-role-input").value;

      // Add to mock array
      adminStats.recentUsers.unshift({
        id: Math.floor(Math.random() * 1000) + 200,
        name: name,
        email: email,
        role: role,
        status: "Verified"
      });

      localStorage.setItem("adminStats", JSON.stringify(adminStats));
      renderUsersTable();

      // Reset modal once the user is successfully added
      const modalEl = document.getElementById('addUserModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      this.reset();
      this.classList.remove("was-validated");
    });
  }

  // 4. MANAGE JOBS EVENT HANDLERS
  const addJobForm = document.getElementById("addJobForm");
  if (addJobForm) {
    addJobForm.addEventListener("submit", function(e) {
      e.preventDefault();

      if (!this.checkValidity()) {
        e.stopPropagation();
        this.classList.add("was-validated");
        return;
      }

      const title = document.getElementById("job-title-input").value.trim();
      const company = document.getElementById("job-company-input").value.trim();
      const location = document.getElementById("job-location-input").value.trim();
      const salary = parseInt(document.getElementById("job-salary-input").value);
      const experience = parseInt(document.getElementById("job-exp-input").value);
      const type = document.getElementById("job-type-input").value;
      const category = document.getElementById("job-cat-input").value;
      const description = document.getElementById("job-desc-input").value.trim();

      const newJob = {
        id: activeJobs.length + 1,
        title: title,
        companyId: company.toLowerCase().replace(/\s+/g, '-'),
        companyName: company,
        logoText: company.substring(0, 2).toUpperCase(),
        location: location,
        salary: salary,
        experience: experience,
        type: type,
        category: category,
        postedDate: "Just now",
        skills: ["Dynamic", "Agile", type],
        description: description,
        requirements: ["Candidate must possess high performance and reliability.", "Strong communication and technical skills."],
        benefits: ["Healthcare packages", "Flexible vacation schedules"]
      };

      // Push to dynamic listings
      activeJobs.unshift(newJob);
      localStorage.setItem("globalJobs", JSON.stringify(activeJobs));
      
      // Update data.js runtime object too
      JobSphereData.jobs = activeJobs;

      // Append to admin tables
      adminStats.recentJobs.unshift({
        id: newJob.id,
        title: title,
        company: company,
        type: type,
        status: "Active",
        applicants: 0
      });
      localStorage.setItem("adminStats", JSON.stringify(adminStats));

      renderJobsTable();
      renderDashboardStats();

      // Reset modal
      const modalEl = document.getElementById('addJobModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      this.reset();
      this.classList.remove("was-validated");
    });
  }

  function renderDashboardStats() {
    document.getElementById("admin-stat-users").innerText = adminStats.totalUsers.toLocaleString();
    document.getElementById("admin-stat-jobs").innerText = activeJobs.length;
    document.getElementById("admin-stat-apps").innerText = adminStats.totalApplications.toLocaleString();
    document.getElementById("admin-stat-revenue").innerText = adminStats.revenue;

    // Render activity list
    const timeline = document.getElementById("admin-timeline");
    if (timeline) {
      timeline.innerHTML = `
        <div class="timeline-activity">
          <div class="timeline-dot"></div>
          <span class="fs-7 fw-semibold text-main d-block">Admin created new corporate campaign</span>
          <span class="text-muted fs-8">1 hour ago</span>
        </div>
        <div class="timeline-activity">
          <div class="timeline-dot bg-warning"></div>
          <span class="fs-7 fw-semibold text-main d-block">New candidate application received for Senior Full Stack Engineer</span>
          <span class="text-muted fs-8">2 hours ago</span>
        </div>
        <div class="timeline-activity">
          <div class="timeline-dot bg-success"></div>
          <span class="fs-7 fw-semibold text-main d-block">Verification audit completed successfully</span>
          <span class="text-muted fs-8">1 day ago</span>
        </div>
      `;
    }
  }

  function renderUsersTable() {
    const tableBody = document.getElementById("admin-users-table");
    if (!tableBody) return;

    tableBody.innerHTML = adminStats.recentUsers.map(user => `
      <tr id="admin-user-row-${user.id}">
        <td><span class="fw-bold text-main">${user.name}</span></td>
        <td>${user.email}</td>
        <td><span class="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1 text-capitalize">${user.role}</span></td>
        <td><span class="badge bg-success px-2.5 py-1 fs-9">${user.status}</span></td>
        <td>
          <button class="btn btn-outline-danger btn-sm border-0 delete-user-btn" data-id="${user.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Wire deletes
    tableBody.querySelectorAll(".delete-user-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        const id = parseInt(this.getAttribute("data-id"));
        adminStats.recentUsers = adminStats.recentUsers.filter(u => u.id !== id);
        localStorage.setItem("adminStats", JSON.stringify(adminStats));
        
        // Remove from DOM
        document.getElementById(`admin-user-row-${id}`)?.remove();
        renderDashboardStats();
      });
    });
  }

  function renderJobsTable() {
    const tableBody = document.getElementById("admin-jobs-table");
    if (!tableBody) return;

    tableBody.innerHTML = adminStats.recentJobs.map(job => `
      <tr id="admin-job-row-${job.id}">
        <td><span class="fw-bold text-main">${job.title}</span></td>
        <td>${job.company}</td>
        <td><span class="badge bg-secondary bg-opacity-10 text-muted px-2 py-1 text-capitalize">${job.type}</span></td>
        <td><span class="badge bg-success px-2 py-1 fs-9">${job.status}</span></td>
        <td class="fw-semibold text-primary text-center">${job.applicants}</td>
        <td>
          <button class="btn btn-outline-danger btn-sm border-0 delete-job-btn" data-id="${job.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Wire deletes
    tableBody.querySelectorAll(".delete-job-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        const id = parseInt(this.getAttribute("data-id"));
        
        // Delete from global listing
        activeJobs = activeJobs.filter(j => j.id !== id);
        localStorage.setItem("globalJobs", JSON.stringify(activeJobs));
        JobSphereData.jobs = activeJobs;

        // Delete from stats table list
        adminStats.recentJobs = adminStats.recentJobs.filter(j => j.id !== id);
        localStorage.setItem("adminStats", JSON.stringify(adminStats));

        document.getElementById(`admin-job-row-${id}`)?.remove();
        renderDashboardStats();
      });
    });
  }

  function initAdminCharts() {
    if (typeof Chart === 'undefined') return;

    // Use light theme colors always for premium contrast
    const textColor = '#64748b';
    const gridColor = '#e2e8f0';

    // Line Chart
    const lineCtx = document.getElementById("adminAnalyticsLine")?.getContext("2d");
    if (lineCtx) {
      lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [{
            label: 'Application Submissions',
            data: [1200, 1800, 2400, 3100, 4200, 5800, 6842],
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            borderColor: '#2563eb',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { padding: 12 }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Inter' } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Inter' } }
            }
          }
        }
      });
    }

    // Pie Chart
    const pieCtx = document.getElementById("adminAnalyticsPie")?.getContext("2d");
    if (pieCtx) {
      pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: ['Technology', 'Design', 'Marketing', 'Finance', 'HR'],
          datasets: [{
            data: adminStats.categoryShare,
            backgroundColor: [
              'rgba(37, 99, 235, 0.75)',
              'rgba(6, 182, 212, 0.75)',
              'rgba(245, 158, 11, 0.75)',
              'rgba(16, 185, 129, 0.75)',
              'rgba(129, 140, 248, 0.75)'
            ],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: textColor,
                font: { family: 'Inter', size: 11 },
                padding: 15
              }
            },
            tooltip: { padding: 10 }
          }
        }
      });
    }
  }

  function updateAdminChartsTheme(isDark) {
    if (!lineChart && !pieChart) return;

    // Always keep light theme colors for premium theme design
    const textColor = '#64748b';
    const gridColor = '#e2e8f0';
    const borderColor = '#ffffff';

    if (lineChart) {
      lineChart.options.scales.x.ticks.color = textColor;
      lineChart.options.scales.x.grid.color = gridColor;
      lineChart.options.scales.y.ticks.color = textColor;
      lineChart.options.scales.y.grid.color = gridColor;
      lineChart.update();
    }

    if (pieChart) {
      pieChart.options.plugins.legend.labels.color = textColor;
      pieChart.data.datasets[0].borderColor = borderColor;
      pieChart.update();
    }
  }
});
