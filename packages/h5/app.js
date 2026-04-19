/**
 * Agent Identity Card - Frontend App
 * Vanilla JS, no dependencies.
 *
 * Testable pure functions are exported via `window.App` for unit testing.
 */

// --- Pure utility functions (testable) ---

/**
 * Parse the QR token from the current URL path.
 * Expected format: /q/:token
 * @param {string} pathname - e.g. "/q/agtid_abc123"
 * @returns {string|null} The token, or null if not a /q/ path.
 */
function parseToken(pathname) {
  var match = pathname.match(/^\/q\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * Generate a warm, human-readable self-introduction when none is provided.
 * @param {object} profile - The profile data.
 * @param {string} profile.name - Agent name.
 * @param {string} [profile.framework_type] - Framework type (flat format).
 * @param {object} [profile.framework] - Framework object (nested format).
 * @param {string} [profile.framework.type] - Framework type from nested object.
 * @param {Array} [profile.skills] - Skills array.
 * @returns {string} A warm intro string.
 */
function generateIntro(profile) {
  var name = profile.name || "Agent";
  var frameworkType = profile.framework_type ||
    (profile.framework && profile.framework.type) ||
    "unknown";
  var skillCount = (profile.skills && profile.skills.length) || 0;

  var templates = [
    "Hi, I'm " + name + "! I'm an AI agent built with " + frameworkType +
      ", equipped with " + skillCount + " skills and ready to help. Let's chat!",
    "Hello there! I'm " + name + ", powered by " + frameworkType +
      ". I've got " + skillCount + " skills up my sleeve — ask me anything!",
    "Hey! I'm " + name + ". I run on " + frameworkType +
      " and bring " + skillCount + " skills to the table. Nice to meet you!",
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Calculate days since a given ISO date string.
 * @param {string} dateStr - ISO date string.
 * @returns {number} Days elapsed.
 */
function daysSince(dateStr) {
  if (!dateStr) return 0;
  var then = new Date(dateStr).getTime();
  var now = Date.now();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

/**
 * Get skill description, supporting both `description` and `desc` field names.
 * @param {object} skill - The skill object.
 * @returns {string} Description text.
 */
function getSkillDesc(skill) {
  return skill.description || skill.desc || "";
}

/**
 * Collect all unique capability tags from a skills array.
 * Handles `skill.capabilities` (array) and also falls back to
 * individual string capabilities if present.
 * @param {Array} skills - Skills array.
 * @returns {Array<string>} Unique capability strings.
 */
function collectCapabilities(skills) {
  var caps = [];
  var seen = {};
  if (!skills) return caps;
  for (var i = 0; i < skills.length; i++) {
    var s = skills[i];
    var items = s.capabilities || [];
    for (var j = 0; j < items.length; j++) {
      var cap = items[j];
      if (!seen[cap]) {
        seen[cap] = true;
        caps.push(cap);
      }
    }
  }
  return caps;
}

// --- DOM rendering ---

/**
 * Render the profile card with the given profile data.
 * @param {object} profile - The profile JSON from the API.
 */
function renderCard(profile) {
  // Avatar
  var avatarEl = document.getElementById("avatar");
  var defaultAvatar = "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<circle cx="32" cy="32" r="32" fill="#30363d"/>' +
    '<text x="32" y="40" text-anchor="middle" fill="#8b949e" font-size="28">A</text>' +
    '</svg>'
  );
  avatarEl.src = profile.avatar_url || profile.avatar || defaultAvatar;
  avatarEl.alt = profile.name || "Agent";

  // Name
  document.getElementById("name").textContent = profile.name || "Agent";

  // Framework
  var frameworkType = profile.framework_type ||
    (profile.framework && profile.framework.type) ||
    "unknown";
  document.getElementById("framework").textContent = frameworkType;

  // Self-introduction
  var intro = profile.self_intro;
  if (!intro || intro.trim() === "") {
    intro = generateIntro(profile);
  }
  document.getElementById("self-intro").textContent = intro;

  // Stats
  var createdAt = (profile.trust && profile.trust.created_at) || "";
  document.getElementById("stat-days").textContent = daysSince(createdAt);

  var skills = profile.skills || [];
  document.getElementById("stat-skills").textContent = skills.length;
  document.getElementById("stat-conversations").textContent =
    (profile.stats && profile.stats.total_conversations) || 0;

  // Skills grid
  var skillsGrid = document.getElementById("skills-grid");
  skillsGrid.innerHTML = "";
  for (var i = 0; i < skills.length; i++) {
    var s = skills[i];
    var tag = document.createElement("div");
    tag.className = "skill-tag";
    tag.innerHTML = '<div class="skill-name">' + escapeHtml(s.name) + '</div>' +
      '<div class="skill-desc">' + escapeHtml(getSkillDesc(s)) + '</div>';
    skillsGrid.appendChild(tag);
  }

  // Capabilities
  var capTags = document.getElementById("cap-tags");
  capTags.innerHTML = "";
  var caps = collectCapabilities(skills);
  for (var j = 0; j < caps.length; j++) {
    var tag = document.createElement("span");
    tag.className = "cap-tag";
    tag.textContent = caps[j];
    capTags.appendChild(tag);
  }

  // Updated-at footer
  var updatedAt = (profile.trust && profile.trust.updated_at) || "";
  if (updatedAt) {
    document.getElementById("updated-at").textContent =
      "Updated " + new Date(updatedAt).toLocaleDateString();
  }

  // Show card, hide loading/error
  document.getElementById("card").style.display = "block";
  document.getElementById("loading").style.display = "none";
  document.getElementById("error").style.display = "none";
}

/**
 * Show the error state.
 * @param {string} message - Error message to display.
 */
function showError(message) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("error").style.display = "block";
  document.getElementById("error-message").textContent = message;
  document.getElementById("card").style.display = "none";
}

/**
 * Escape HTML entities to prevent XSS.
 * @param {string} str - Raw string.
 * @returns {string} Escaped string.
 */
function escapeHtml(str) {
  if (!str) return "";
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// --- Button handlers (stubs) ---

function setupButtons(profile) {
  var profileUrl = profile.profile_url || window.location.href;

  document.getElementById("btn-greet").onclick = function() {
    alert("Hi " + (profile.name || "Agent") + "! 👋");
  };

  document.getElementById("btn-friend").onclick = function() {
    alert("Friend request sent to " + (profile.name || "Agent") + "! 🤝");
  };

  document.getElementById("btn-clone").onclick = function() {
    alert("Get your own Agent Identity Card! ❤️");
  };
}

// --- Main entry point ---

/**
 * Load and display the profile for the given QR token.
 * @param {string} token - The QR token from the URL.
 */
async function loadProfile(token) {
  try {
    var res = await fetch("/api/v1/profile/" + encodeURIComponent(token));
    if (!res.ok) {
      if (res.status === 404) {
        showError("Profile not found. The QR code may may be invalid.");
      } else {
        showError("Failed to load profile. Please try again later.");
      }
      return;
    }
    var profile = await res.json();
    renderCard(profile);
    setupButtons(profile);
  } catch (err) {
    showError("Network error. Please check your connection and try again.");
  }
}

// Auto-init on page load (browser environment only)
if (typeof window !== "undefined" && typeof document !== "undefined" && document.getElementById) {
  document.addEventListener("DOMContentLoaded", function() {
    var token = parseToken(window.location.pathname);
    if (token) {
      loadProfile(token);
    } else {
      // Not a /q/ path — could show a landing page or redirect
      showError("No agent token found. Please scan a QR code to view an identity card.");
    }
  });
}

// Export for testing
if (typeof window !== "undefined") {
  window.App = {
    parseToken: parseToken,
    generateIntro: generateIntro,
    daysSince: daysSince,
    getSkillDesc: getSkillDesc,
    collectCapabilities: collectCapabilities,
    escapeHtml: escapeHtml,
    renderCard: renderCard,
    showError: showError,
    loadProfile: loadProfile,
    setupButtons: setupButtons,
  };
}
