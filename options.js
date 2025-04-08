// options.js
let currentProfiles = [];
let currentEditingId = null;

document.addEventListener("DOMContentLoaded", function () {
  // Load and display profiles
  loadProfiles();

  // Set up event listeners
  document
    .getElementById("add-profile")
    .addEventListener("click", createNewProfile);
  document
    .getElementById("profile-form")
    .addEventListener("submit", saveProfile);
  document.getElementById("cancel-edit").addEventListener("click", cancelEdit);
  document
    .getElementById("add-work")
    .addEventListener("click", addWorkHistoryField);
  document
    .getElementById("add-education")
    .addEventListener("click", addEducationField);
});

function loadProfiles() {
  chrome.storage.sync.get("profiles", (data) => {
    if (data.profiles) {
      currentProfiles = data.profiles;
      displayProfiles();
    } else {
      currentProfiles = [];
    }
  });
}

function displayProfiles() {
  const profilesList = document.getElementById("profiles-list");
  profilesList.innerHTML = "";

  currentProfiles.forEach((profile) => {
    const li = document.createElement("li");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = profile.name;
    li.appendChild(nameSpan);

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "profile-actions";

    const editButton = document.createElement("button");
    editButton.className = "action-button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editProfile(profile.id));
    actionsDiv.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.className = "action-button delete";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteProfile(profile.id));
    actionsDiv.appendChild(deleteButton);

    li.appendChild(actionsDiv);
    profilesList.appendChild(li);
  });
}

function createNewProfile() {
  currentEditingId = null;
  document.getElementById("editor-title").textContent = "Create New Profile";
  document.getElementById("profile-form").reset();

  // Set default country code
  document.getElementById("country-code").value = "+91";

  // Clear existing work history and education fields
  document.getElementById("work-history-container").innerHTML = "";
  document.getElementById("education-container").innerHTML = "";

  // Add one empty work and education field
  addWorkHistoryField();
  addEducationField();

  // Show the editor
  document.querySelector(".profile-editor").style.display = "block";
}

function editProfile(profileId) {
  const profile = currentProfiles.find((p) => p.id === profileId);
  if (!profile) return;

  currentEditingId = profileId;
  document.getElementById("editor-title").textContent = `Edit: ${profile.name}`;

  // Fill the form with profile data
  document.getElementById("profile-name").value = profile.name;
  document.getElementById("first-name").value =
    profile.personalInfo.firstName || "";
  document.getElementById("last-name").value =
    profile.personalInfo.lastName || "";
  document.getElementById("email").value = profile.personalInfo.email || "";

  // Set country code
  document.getElementById("country-code").value =
    profile.personalInfo.countryCode || "+91";
  document.getElementById("phone").value = profile.personalInfo.phone || "";
  document.getElementById("address").value = profile.personalInfo.address || "";

  // Fill the job preference fields
  document.getElementById("overall-experience").value =
    profile.personalInfo.overallExperience || "";
  document.getElementById("current-ctc").value =
    profile.personalInfo.currentCtc || "";
  document.getElementById("expected-ctc").value =
    profile.personalInfo.expectedCtc || "";
  document.getElementById("notice-period").value =
    profile.personalInfo.noticePeriod || "";
  document.getElementById("location-preference").value =
    profile.personalInfo.locationPreference || "";

  // Clear existing work history and education fields
  document.getElementById("work-history-container").innerHTML = "";
  document.getElementById("education-container").innerHTML = "";

  // Add work history entries
  if (profile.workHistory && profile.workHistory.length) {
    profile.workHistory.forEach((work) => addWorkHistoryField(work));
  } else {
    addWorkHistoryField();
  }

  // Add education entries
  if (profile.education && profile.education.length) {
    profile.education.forEach((edu) => addEducationField(edu));
  } else {
    addEducationField();
  }

  // Show the editor
  document.querySelector(".profile-editor").style.display = "block";
}

function saveProfile(event) {
  event.preventDefault();

  // Gather form data
  const name = document.getElementById("profile-name").value;
  const personalInfo = {
    firstName: document.getElementById("first-name").value,
    lastName: document.getElementById("last-name").value,
    email: document.getElementById("email").value,
    countryCode: document.getElementById("country-code").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value,

    // Job preference fields
    overallExperience: document.getElementById("overall-experience").value,
    currentCtc: document.getElementById("current-ctc").value,
    expectedCtc: document.getElementById("expected-ctc").value,
    noticePeriod: document.getElementById("notice-period").value,
    locationPreference: document.getElementById("location-preference").value,

    links: [], // We'll implement this later
  };

  // Gather work history
  const workHistoryEntries = document.querySelectorAll(".work-entry");
  const workHistory = Array.from(workHistoryEntries)
    .map((entry) => {
      return {
        company: entry.querySelector(".work-company").value,
        title: entry.querySelector(".work-title").value,
        startDate: entry.querySelector(".work-start-date").value,
        endDate: entry.querySelector(".work-end-date").value,
        description: entry.querySelector(".work-description").value,
      };
    })
    .filter((work) => work.company || work.title); // Only keep entries with at least company or title

  // Gather education
  const educationEntries = document.querySelectorAll(".education-entry");
  const education = Array.from(educationEntries)
    .map((entry) => {
      return {
        school: entry.querySelector(".education-school").value,
        degree: entry.querySelector(".education-degree").value,
        field: entry.querySelector(".education-field").value,
        startDate: entry.querySelector(".education-start-date").value,
        endDate: entry.querySelector(".education-end-date").value,
      };
    })
    .filter((edu) => edu.school || edu.degree); // Only keep entries with at least school or degree

  // Create profile object
  const profile = {
    id: currentEditingId || "profile_" + Date.now(),
    name,
    personalInfo,
    workHistory,
    education,
    skills: [],
    references: [],
    documents: [],
  };

  // Update or add profile
  if (currentEditingId) {
    // Update existing profile
    const index = currentProfiles.findIndex((p) => p.id === currentEditingId);
    if (index !== -1) {
      currentProfiles[index] = profile;
    }
  } else {
    // Add new profile
    currentProfiles.push(profile);
  }

  // Save to storage
  chrome.storage.sync.set({ profiles: currentProfiles }, () => {
    // If this is the first profile, make it active
    if (currentProfiles.length === 1) {
      chrome.storage.sync.set({ activeProfileId: profile.id });
    }

    // Refresh the display
    displayProfiles();

    // Hide the editor
    document.querySelector(".profile-editor").style.display = "none";
  });
}

function cancelEdit() {
  document.querySelector(".profile-editor").style.display = "none";
}

function deleteProfile(profileId) {
  if (!confirm("Are you sure you want to delete this profile?")) return;

  const index = currentProfiles.findIndex((p) => p.id === profileId);
  if (index !== -1) {
    currentProfiles.splice(index, 1);

    // Save to storage
    chrome.storage.sync.set({ profiles: currentProfiles }, () => {
      // If we deleted the active profile, set a new one
      chrome.storage.sync.get("activeProfileId", (data) => {
        if (data.activeProfileId === profileId && currentProfiles.length > 0) {
          chrome.storage.sync.set({ activeProfileId: currentProfiles[0].id });
        }

        // Refresh the display
        displayProfiles();
      });
    });
  }
}

function addWorkHistoryField(workData = null) {
  const container = document.getElementById("work-history-container");
  const entryId = "work_" + Date.now();

  const entryDiv = document.createElement("div");
  entryDiv.className = "form-entry work-entry";
  entryDiv.id = entryId;

  entryDiv.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label>Company</label>
        <input type="text" class="work-company" value="${
          workData?.company || ""
        }">
      </div>
      <div class="form-group">
        <label>Job Title</label>
        <input type="text" class="work-title" value="${workData?.title || ""}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Start Date</label>
        <input type="text" class="work-start-date" placeholder="MM/YYYY" value="${
          workData?.startDate || ""
        }">
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input type="text" class="work-end-date" placeholder="MM/YYYY or Present" value="${
          workData?.endDate || ""
        }">
      </div>
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea class="work-description">${
        workData?.description || ""
      }</textarea>
    </div>
    <div class="form-actions entry-actions">
      <button type="button" class="text-button remove-entry">Remove</button>
    </div>
  `;

  container.appendChild(entryDiv);

  // Add event listener for remove button
  entryDiv
    .querySelector(".remove-entry")
    .addEventListener("click", function () {
      container.removeChild(entryDiv);
    });
}

function addEducationField(eduData = null) {
  const container = document.getElementById("education-container");
  const entryId = "edu_" + Date.now();

  const entryDiv = document.createElement("div");
  entryDiv.className = "form-entry education-entry";
  entryDiv.id = entryId;

  entryDiv.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label>School</label>
        <input type="text" class="education-school" value="${
          eduData?.school || ""
        }">
      </div>
      <div class="form-group">
        <label>Degree</label>
        <input type="text" class="education-degree" value="${
          eduData?.degree || ""
        }">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Field of Study</label>
        <input type="text" class="education-field" value="${
          eduData?.field || ""
        }">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Start Date</label>
        <input type="text" class="education-start-date" placeholder="MM/YYYY" value="${
          eduData?.startDate || ""
        }">
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input type="text" class="education-end-date" placeholder="MM/YYYY or Present" value="${
          eduData?.endDate || ""
        }">
      </div>
    </div>
    <div class="form-actions entry-actions">
      <button type="button" class="text-button remove-entry">Remove</button>
    </div>
  `;

  container.appendChild(entryDiv);

  // Add event listener for remove button
  entryDiv
    .querySelector(".remove-entry")
    .addEventListener("click", function () {
      container.removeChild(entryDiv);
    });
}
