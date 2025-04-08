document.addEventListener("DOMContentLoaded", function () {
  // Load profiles and populate dropdown
  loadProfiles();

  // Set up event listeners
  document.getElementById("fill-button").addEventListener("click", fillForm);
  document
    .getElementById("options-button")
    .addEventListener("click", openOptions);
  document
    .getElementById("profile-select")
    .addEventListener("change", changeActiveProfile);
});

function loadProfiles() {
  chrome.storage.sync.get(["profiles", "activeProfileId"], (data) => {
    const profileSelect = document.getElementById("profile-select");
    profileSelect.innerHTML = "";

    if (data.profiles && data.profiles.length) {
      data.profiles.forEach((profile) => {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name;

        if (profile.id === data.activeProfileId) {
          option.selected = true;
        }

        profileSelect.appendChild(option);
      });
    } else {
      const option = document.createElement("option");
      option.textContent = "No profiles available";
      profileSelect.appendChild(option);

      // Disable fill button if no profiles
      document.getElementById("fill-button").disabled = true;
    }
  });
}

function fillForm() {
  const statusMessage = document.getElementById("status-message");
  statusMessage.textContent = "Filling form...";

  chrome.runtime.sendMessage({ action: "fillForm" }, (response) => {
    statusMessage.textContent = "Form filling initiated!";
    setTimeout(() => {
      statusMessage.textContent = "";
    }, 3000);
  });
}

function changeActiveProfile() {
  const profileId = document.getElementById("profile-select").value;
  chrome.storage.sync.set({ activeProfileId: profileId });
}

function openOptions() {
  chrome.runtime.openOptionsPage();
}
