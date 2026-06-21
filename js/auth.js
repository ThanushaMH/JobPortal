/* =========================================================
   auth.js - Authentication Flow (Login & Register)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initPasswordToggles();
    initSocialLogins();
    initRoleToggle();
    initRegisterForm();
    initLoginForm();
    initGsapAnimations();
});

/**
 * Handles showing/hiding password input text.
 */
// function initPasswordToggles() {
//     const buttons = document.querySelectorAll(".toggle-password-btn");
//     buttons.forEach(btn => {
//         btn.addEventListener("click", () => {
//             const targetId = btn.getAttribute("data-target");
//             const input = document.getElementById(targetId);
//             const icon = btn.querySelector("i");
            
//             if (input && input.type === "password") {
//                 input.type = "text";
//                 icon.className = "bi bi-eye-slash-fill";
//             } else if (input) {
//                 input.type = "password";
//                 // icon.className = "bi bi-eye-fill";
//             }
//         });
//     });
// }

/**
 * Handles mock social login clicks.
 */
function initSocialLogins() {
    const buttons = document.querySelectorAll(".social-auth-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const provider = btn.getAttribute("aria-label") || "Social";
            alert(`${provider} login is simulated for demo purposes.`);
        });
    });
}

/**
 * Toggles required candidate fields on the registration form based on selected role.
 */
function initRoleToggle() {
    const roleSelect = document.getElementById("reg-role");
    const candidateFields = document.getElementById("candidate-fields");
    
    if (!roleSelect || !candidateFields) return;

    roleSelect.addEventListener("change", () => {
        const isCandidate = roleSelect.value === "candidate";
        candidateFields.classList.toggle("d-none", !isCandidate);
        
        // Toggle required attributes for candidate specific fields
        const fieldIds = ["reg-degree", "reg-branch", "reg-college", "reg-grad-year", "reg-cgpa", "reg-pref-role", "reg-pref-location", "reg-skills"];
        fieldIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (isCandidate) el.setAttribute("required", "required");
                else el.removeAttribute("required");
            }
        });
    });
}

/**
 * Handles user registration logic, duplicate checks, and saving to localStorage.
 */
function initRegisterForm() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Form Validation Check
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add("was-validated");
            return;
        }

        // Get Input Values
        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim().toLowerCase();
        const role = document.getElementById("reg-role").value;
        const password = document.getElementById("reg-password").value;

        // 1. Fetch Existing Users Array
        const users = JSON.parse(localStorage.getItem("users")) || [];

        // 2. Prevent Duplicate Email Registration
        const userExists = users.some(u => u.email === email);
        if (userExists) {
            alert("Account already exists with this email.");
            return;
        }

        // 3. Save New User
        const newUser = { name, email, role, password };
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        // 4. Initialize Candidate Profile Data
        if (role === "candidate") {
            const skillsRaw = document.getElementById("reg-skills").value;
            const skills = skillsRaw.split(",").map(s => s.trim()).filter(s => s !== "");
            
            // Build a base profile without depending on external data.js
            const profile = {
                name: name,
                email: email,
                title: document.getElementById("reg-pref-role").value.trim() || "Candidate",
                location: document.getElementById("reg-pref-location").value.trim() || "Remote",
                avatar: name.substring(0, 2).toUpperCase(),
                completionPercentage: 100,
                skills: skills.length > 0 ? skills : ["HTML", "CSS", "JS"],
                education: {
                    degree: document.getElementById("reg-degree").value.trim(),
                    branch: document.getElementById("reg-branch").value.trim(),
                    college: document.getElementById("reg-college").value.trim(),
                    gradYear: document.getElementById("reg-grad-year").value.trim(),
                    cgpa: document.getElementById("reg-cgpa").value.trim()
                },
                resumeStatus: {
                    uploaded: true,
                    filename: document.getElementById("reg-resume").files[0]?.name || "resume.pdf",
                    lastUpdated: new Date().toLocaleDateString(),
                    visibility: "Recruiters Only"
                },
                stats: { applied: 0, saved: 0, interviews: 0, offers: 0 },
                activities: [],
                notifications: [],
                appliedJobs: []
            };
            
            localStorage.setItem("profileData", JSON.stringify(profile));
        }

        // 5. Success Message & Redirect to Login
        alert("Account created successfully. Please log in.");
        window.location.href = "login.html";
    });
}

/**
 * Handles user login validation and session creation.
 */
function initLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Form Validation Check
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add("was-validated");
            return;
        }

        // Get Input Values
        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;
        const remember = document.getElementById("rememberMe").checked;

        // 1. Fetch Registered Users
        const users = JSON.parse(localStorage.getItem("users")) || [];

        // 2. Validate Credentials Against Users Array
        let validUser = users.find(u => u.email === email && u.password === password);
        
        // Fallback for demo admin if users array is empty
        if (!validUser && email === "admin@jobsphere.com" && password === "admin123") {
            validUser = { name: "Administrator", email: email, role: "admin" };
        }

        // Handle Invalid Credentials
        if (!validUser) {
            alert("Invalid email or password.");
            return;
        }

        // 3. Create Active Session (loggedInUser)
        const loggedInUser = {
            name: validUser.name,
            email: validUser.email,
            role: validUser.role,
            remember: remember
        };
        localStorage.setItem("loggedInUser", JSON.stringify(loggedInUser));

        // 4. Redirect Based on Role
        if (validUser.role === "admin") {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "candidate-dashboard.html";
        }
    });
}

/**
 * Initializes floating circle background animations.
 */
function initGsapAnimations() {
    if (typeof gsap !== "undefined") {
        gsap.to(".auth-circle-1", { y: 30, x: 10, duration: 5, repeat: -1, yoyo: true }); //yoyo - Makes animation reverse
        gsap.to(".auth-circle-2", { y: -40, x: -20, duration: 6, repeat: -1, yoyo: true });
        gsap.to(".auth-circle-3", { scale: 1.15, opacity: 0.8, duration: 4, repeat: -1, yoyo: true });
    }
}