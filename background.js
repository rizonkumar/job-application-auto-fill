// background.js
console.log("Background script loaded");

// Initialize default profile if none exists
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("profiles", (data) => {
    if (!data.profiles || !data.profiles.length) {
      const defaultProfile = {
        id: "default",
        name: "Default Profile",
        personalInfo: {
          firstName: "",
          lastName: "",
          email: "",
          countryCode: "+91",
          phone: "",
          address: "",
          overallExperience: "3",
          currentCtc: "5",
          expectedCtc: "12",
          noticePeriod: "30",
          locationPreference: "Bangalore",
          links: [],
        },
        workHistory: [],
        education: [],
        skills: [
          { name: "JavaScript", years: "3" },
          { name: "React", years: "2" },
          { name: "Angular", years: "1" },
          { name: "Node.js", years: "2" },
          { name: "HTML/CSS", years: "3" },
        ],
        references: [],
        documents: [],
      };

      chrome.storage.sync.set({
        profiles: [defaultProfile],
        activeProfileId: "default",
      });
    }
  });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillForm") {
    // Get active profile and send to content script
    chrome.storage.sync.get(["profiles", "activeProfileId"], (data) => {
      const activeProfile = data.profiles.find(
        (p) => p.id === data.activeProfileId
      );

      // Send to active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "fillFormWithProfile",
          profile: activeProfile,
        });
      });
    });
    return true;
  }
});
