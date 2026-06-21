document.addEventListener("DOMContentLoaded", () => {
  // Initialize AOS
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50
    });
  }

  // Dark Mode Configuration
  const themeToggleBtn = document.getElementById("theme-toggle");
  
  // Apply saved theme or default to light
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.body.classList.add("dark-theme");
    updateThemeIcon(true);
  } else {
    document.body.classList.remove("dark-theme");
    updateThemeIcon(false);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-theme");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateThemeIcon(isDark);
      
      // Dispatch custom event so that charts can update their styling
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
    });
  }

  function updateThemeIcon(isDark) {
    if (!themeToggleBtn) return;
    const icon = themeToggleBtn.querySelector("i");
    if (icon) {
      if (isDark) {
        icon.className = "bi bi-sun-fill";
      } else {
        icon.className = "bi bi-moon-stars-fill";
      }
    }
  }

  // Set active nav link based on current page
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
  
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href && currentPath.includes(href)) {
      link.classList.add("active");
    } else if (href === "index.html" && (currentPath.endsWith("/") || currentPath.endsWith("index.html"))) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Handle saved jobs state syncing across pages
  initSavedJobs();

  // Fake navbar login detection
  checkUserSession();
});

// Saved Jobs in localStorage
function initSavedJobs() {
  if (!localStorage.getItem("savedJobs")) {
    localStorage.setItem("savedJobs", JSON.stringify([2, 4]));
  }
}

function checkUserSession() {
  const loggedInUser = localStorage.getItem("loggedInUser");
  const authNavContainer = document.getElementById("auth-nav-container");
  
  if (authNavContainer) {
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      let dashboardPage = user.role === "admin" ? "admin-dashboard.html" : "candidate-dashboard.html";
      
      authNavContainer.innerHTML = `
        <div class="dropdown">
          <a class="btn-premium-primary dropdown-toggle d-flex align-items-center gap-2" href="#" role="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle"></i> ${user.name}
          </a>
          <ul class="dropdown-menu dropdown-menu-end glass-card shadow" aria-labelledby="userDropdown">
            <li><a class="dropdown-item py-2" href="${dashboardPage}"><i class="bi bi-speedometer2 me-2 text-primary"></i>Dashboard</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item py-2 text-danger" href="#" id="logout-btn"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </div>
      `;
      
      document.getElementById("logout-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("loggedInUser");
        window.location.href = "index.html";
      });
    } else {
      authNavContainer.innerHTML = `
        <a href="login.html" class="btn-premium-secondary me-2">Login</a>
        <a href="register.html" class="btn-premium-primary">Register</a>
      `;
    }
  }

  // Premium Upgrade Buttons logic for Home Page and generic upgrade actions
  const premiumBtns = document.querySelectorAll(".premium-upgrade-btn");
  premiumBtns.forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      const plan = this.getAttribute("data-plan");
      const price = parseInt(this.getAttribute("data-price"));
      
      const loggedUserRaw = localStorage.getItem("loggedInUser");
      if (!loggedUserRaw) {
        alert("Please login first to upgrade your account.");
        window.location.href = "login.html";
        return;
      }
      const loggedUser = JSON.parse(loggedUserRaw);
      if (loggedUser.role === "admin") {
        alert("Only candidates can purchase premium memberships.");
        return;
      }
      
      let profile = JSON.parse(localStorage.getItem("profileData")) || {};
      if (!profile.premiumPlan) profile.premiumPlan = {};
      
      profile.premiumPlan.active = true;
      profile.premiumPlan.plan = plan;
      profile.premiumPlan.price = price;
      
      const now = new Date();
      profile.premiumPlan.activatedDate = now.toISOString();
      
      const expiry = new Date(now);
      if (plan === "6-month") expiry.setMonth(expiry.getMonth() + 6);
      if (plan === "1-year") expiry.setFullYear(expiry.getFullYear() + 1);
      profile.premiumPlan.expiryDate = expiry.toISOString();
      
      if (!profile.activities) profile.activities = [];
      profile.activities.unshift({ text: `Upgraded to ${plan} Premium Membership ($${price})`, time: "Just now" });
      
      localStorage.setItem("profileData", JSON.stringify(profile));
      alert(`Successfully upgraded to ${plan} Premium Membership!`);
      window.location.href = "candidate-dashboard.html";
    });
  });
}

