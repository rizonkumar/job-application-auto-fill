// content.js - Enhanced version
console.log("Content script loaded");

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillFormWithProfile") {
    console.log("Filling form with profile:", request.profile);
    fillFormWithProfile(request.profile);
    sendResponse({ status: "Form filling initiated" });
  }
  return true;
});

// Enhanced form filling function
function fillFormWithProfile(profile) {
  console.log("Filling form with profile:", profile);

  // Map profile data to field identifiers
  const fieldMappings = createFieldMappings(profile);

  // Find and fill input fields
  fillTextFields(fieldMappings);

  // Handle dropdown selects
  fillDropdowns(fieldMappings);

  // Handle country code dropdowns specifically
  handleCountryCodeDropdown(profile.personalInfo.countryCode);

  console.log("Form filling complete");
}

function createFieldMappings(profile) {
  // Values formatted exactly as needed for job applications
  const experienceValue = profile.personalInfo.overallExperience || "3";
  const currentCtcValue = profile.personalInfo.currentCtc || "5";
  const expectedCtcValue = profile.personalInfo.expectedCtc || "12";
  const noticePeriodValue = profile.personalInfo.noticePeriod || "30";

  // Create comprehensive mappings for all field types
  return {
    // Personal information
    "first-name": {
      value: profile.personalInfo.firstName,
      matchers: ["first name", "firstname", "fname", "given name"],
    },
    "last-name": {
      value: profile.personalInfo.lastName,
      matchers: ["last name", "lastname", "lname", "surname", "family name"],
    },
    "full-name": {
      value: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
      matchers: ["full name", "name"],
    },
    email: {
      value: profile.personalInfo.email,
      matchers: ["email", "e-mail", "email address"],
    },
    phone: {
      value: profile.personalInfo.phone,
      matchers: [
        "phone",
        "telephone",
        "mobile",
        "cell phone",
        "phone number",
        "mobile phone number",
      ],
    },
    address: {
      value: profile.personalInfo.address,
      matchers: ["address", "street address", "home address"],
    },

    // Experience fields (common in job applications)
    experience: {
      value: experienceValue,
      matchers: [
        "overall exp",
        "years of experience",
        "work experience",
        "total experience",
        "overall experience",
      ],
    },
    ctc: {
      value: currentCtcValue,
      matchers: ["current ctc", "overall ctc", "salary", "current salary"],
    },
    "expected-ctc": {
      value: expectedCtcValue,
      matchers: [
        "expected ctc",
        "expected salary",
        "salary expectation",
        "expected CTC",
      ],
    },
    "notice-period": {
      value: noticePeriodValue,
      matchers: [
        "notice period",
        "joining time",
        "expected notice period",
        "notice",
      ],
    },

    // Location preferences
    "location-preference": {
      value: profile.personalInfo.locationPreference || "Yes",
      matchers: [
        "comfortable",
        "will you be comfortable",
        "relocate",
        "willing to relocate",
        "location preference",
        "location",
      ],
    },

    // Work history (for the most recent job)
    company: {
      value:
        profile.workHistory && profile.workHistory.length > 0
          ? profile.workHistory[0].company
          : "",
      matchers: ["company name", "employer", "current company", "company"],
    },
    "job-title": {
      value:
        profile.workHistory && profile.workHistory.length > 0
          ? profile.workHistory[0].title
          : "",
      matchers: [
        "job title",
        "position",
        "role",
        "current role",
        "designation",
        "title",
      ],
    },
    "start-date": {
      value:
        profile.workHistory && profile.workHistory.length > 0
          ? profile.workHistory[0].startDate
          : "",
      matchers: ["start date", "from date", "employment start"],
    },
    "end-date": {
      value:
        profile.workHistory && profile.workHistory.length > 0
          ? profile.workHistory[0].endDate
          : "",
      matchers: ["end date", "to date", "employment end", "present"],
    },
  };
}

function fillTextFields(fieldMappings) {
  // Get all input and textarea elements
  const inputFields = document.querySelectorAll(
    'input[type="text"], input[type="email"], input[type="tel"], textarea, input:not([type])'
  );

  inputFields.forEach((field) => {
    // Skip fields that are already filled
    if (field.value && field.value.length > 0) return;

    const fieldId = (field.id || "").toLowerCase();
    const fieldName = (field.name || "").toLowerCase();
    const fieldPlaceholder = (field.placeholder || "").toLowerCase();
    const fieldLabel = getFieldLabel(field);
    const ariaLabel = (field.getAttribute("aria-label") || "").toLowerCase();

    // Combine all field identifiers for matching
    const fieldIdentifiers = [
      fieldId,
      fieldName,
      fieldPlaceholder,
      fieldLabel,
      ariaLabel,
    ].filter(Boolean);

    // Try to match field with our mappings
    for (const [key, mapping] of Object.entries(fieldMappings)) {
      // Skip if no value to fill
      if (!mapping.value) continue;

      // Check all possible matchers for this field
      const isMatch = mapping.matchers.some((matcher) =>
        fieldIdentifiers.some((identifier) => {
          // Use more exact matching for critical fields like CTC and experience
          if (
            ["ctc", "experience", "expected-ctc", "notice-period"].includes(key)
          ) {
            return identifier.includes(matcher);
          }
          return identifier.includes(matcher);
        })
      );

      if (isMatch) {
        // Set the value
        field.value = mapping.value;

        // Trigger events to ensure the form recognizes the change
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
        field.dispatchEvent(new Event("blur", { bubbles: true }));

        console.log(
          `Filled field: ${field.name || field.id} with value: ${mapping.value}`
        );
        break;
      }
    }
  });
}

function fillDropdowns(fieldMappings) {
  // Get all select elements
  const selectFields = document.querySelectorAll("select");

  selectFields.forEach((select) => {
    // Skip country code select which is handled separately
    if (
      select.id.includes("country-code") ||
      select.name.includes("country-code") ||
      select.id.includes("countryCode") ||
      select.name.includes("countryCode")
    ) {
      return;
    }

    const fieldId = (select.id || "").toLowerCase();
    const fieldName = (select.name || "").toLowerCase();
    const fieldLabel = getFieldLabel(select);
    const ariaLabel = (select.getAttribute("aria-label") || "").toLowerCase();

    // Combine all field identifiers for matching
    const fieldIdentifiers = [fieldId, fieldName, fieldLabel, ariaLabel].filter(
      Boolean
    );

    // Try to match field with our mappings
    for (const [key, mapping] of Object.entries(fieldMappings)) {
      // Skip if no value to fill
      if (!mapping.value) continue;

      // Check all possible matchers for this field
      const isMatch = mapping.matchers.some((matcher) =>
        fieldIdentifiers.some((identifier) => identifier.includes(matcher))
      );

      if (isMatch) {
        // For dropdowns, we need to find the option that best matches our value
        selectOptionByValue(select, mapping.value);
        console.log(
          `Filled dropdown: ${select.name || select.id} with value close to: ${
            mapping.value
          }`
        );
        break;
      }
    }
  });

  // Also handle custom dropdowns that use divs and not real select elements
  handleCustomDropdowns(fieldMappings);
}

function handleCountryCodeDropdown(countryCode) {
  // Default to India (+91) if not specified
  countryCode = countryCode || "+91";

  // Find country code dropdowns
  const countrySelects = document.querySelectorAll("select");

  countrySelects.forEach((select) => {
    const fieldId = (select.id || "").toLowerCase();
    const fieldName = (select.name || "").toLowerCase();
    const fieldLabel = getFieldLabel(select);

    if (
      fieldId.includes("country") ||
      fieldName.includes("country") ||
      fieldLabel.includes("country") ||
      fieldId.includes("dial") ||
      fieldName.includes("dial")
    ) {
      // Look for the option that contains the country code
      for (const option of select.options) {
        if (
          option.text.includes(countryCode) ||
          option.value.includes(countryCode) ||
          option.text.includes("India") ||
          option.value.includes("India")
        ) {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          console.log(`Selected country code: ${option.text}`);
          break;
        }
      }
    }
  });

  // Also try to find custom country code dropdowns
  const customDropdowns = document.querySelectorAll(
    '.dropdown, [role="listbox"], [role="combobox"]'
  );

  customDropdowns.forEach((dropdown) => {
    const dropdownText = dropdown.textContent.toLowerCase();

    if (
      dropdownText.includes("country") ||
      dropdownText.includes("dial") ||
      dropdownText.includes("+") ||
      dropdownText.includes("code")
    ) {
      dropdown.click();

      // Wait for dropdown to open
      setTimeout(() => {
        // Find the India option
        const options = document.querySelectorAll(
          "li, .dropdown-option, .select-option"
        );

        for (const option of options) {
          if (
            option.textContent.includes("India") ||
            option.textContent.includes("+91")
          ) {
            option.click();
            console.log("Selected India (+91) from custom dropdown");
            break;
          }
        }
      }, 500);
    }
  });
}

function selectOptionByValue(selectElement, desiredValue) {
  // Try exact match first
  for (const option of selectElement.options) {
    if (
      option.text.toLowerCase() === desiredValue.toLowerCase() ||
      option.value.toLowerCase() === desiredValue.toLowerCase()
    ) {
      selectElement.value = option.value;
      selectElement.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }

  // If no exact match, try contains
  for (const option of selectElement.options) {
    if (
      option.text.toLowerCase().includes(desiredValue.toLowerCase()) ||
      desiredValue.toLowerCase().includes(option.text.toLowerCase())
    ) {
      selectElement.value = option.value;
      selectElement.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }

  // If nothing found and there's at least one option (besides the default/placeholder)
  if (selectElement.options.length > 1) {
    // Select the first non-empty option as fallback
    for (const option of selectElement.options) {
      if (option.value && option.value !== "" && !option.disabled) {
        selectElement.value = option.value;
        selectElement.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
  }

  return false;
}

function handleCustomDropdowns(fieldMappings) {
  // Many sites use custom dropdowns with divs/spans that look like select elements

  // Common classes and patterns for custom dropdowns
  const dropdownSelectors = [
    ".dropdown",
    '[role="listbox"]',
    '[role="combobox"]',
    ".select-container",
    ".custom-select",
    ".MuiSelect-root",
    // LinkedIn specific selectors
    ".artdeco-dropdown__trigger",
    ".artdeco-dropdown__content",
    // Add any other common selectors
  ];

  const customDropdowns = document.querySelectorAll(
    dropdownSelectors.join(",")
  );

  customDropdowns.forEach((dropdown) => {
    // Skip if it looks like a country code dropdown
    if (
      dropdown.textContent.toLowerCase().includes("country") ||
      dropdown.textContent.toLowerCase().includes("dial") ||
      dropdown.textContent.toLowerCase().includes("+")
    ) {
      return;
    }

    // Try to find the label or placeholder text
    const dropdownLabel = getCustomDropdownLabel(dropdown);

    if (!dropdownLabel) return;

    // Try to match with our fields
    for (const [key, mapping] of Object.entries(fieldMappings)) {
      if (!mapping.value) continue;

      const isMatch = mapping.matchers.some((matcher) =>
        dropdownLabel.toLowerCase().includes(matcher)
      );

      if (isMatch) {
        // Try to open the dropdown
        dropdown.click();

        // Wait a bit for the dropdown to open
        setTimeout(() => {
          // Look for options
          const options = document.querySelectorAll(
            '.dropdown-option, .select-option, li[role="option"], .MuiMenuItem-root, .artdeco-dropdown__item'
          );

          for (const option of options) {
            if (
              option.textContent
                .toLowerCase()
                .includes(mapping.value.toLowerCase())
            ) {
              option.click();
              console.log(
                `Selected custom dropdown option: ${option.textContent}`
              );
              return;
            }
          }
        }, 500);

        break;
      }
    }
  });
}

function getFieldLabel(field) {
  // Try to find a label for this field
  let label = "";

  // Check for label element
  const labelElement = document.querySelector(`label[for="${field.id}"]`);
  if (labelElement) {
    label = labelElement.textContent.trim().toLowerCase();
  }

  // Check for parent label
  if (!label && field.closest("label")) {
    label = field.closest("label").textContent.trim().toLowerCase();
  }

  // Check for preceding label-like elements
  if (!label) {
    // Get all previous siblings until we find something that looks like a label
    let currentElement = field.previousElementSibling;
    while (currentElement && !label) {
      if (
        currentElement.tagName === "LABEL" ||
        currentElement.classList.contains("form-label") ||
        currentElement.classList.contains("field-label")
      ) {
        label = currentElement.textContent.trim().toLowerCase();
      }
      currentElement = currentElement.previousElementSibling;
    }
  }

  // Check for parent div with possible label
  if (!label && field.parentElement) {
    const parentText = field.parentElement.textContent.trim();
    // Only use parent text if it's reasonably short (likely to be a label)
    if (parentText.length < 50) {
      const inputValue = field.value || "";
      // Make sure we're not counting the input's own value as the label
      if (!inputValue || !parentText.includes(inputValue)) {
        label = parentText.toLowerCase();
      }
    }
  }

  return label;
}

function getCustomDropdownLabel(dropdown) {
  // Similar to getFieldLabel but for custom dropdowns

  // Check for aria-label
  let label = dropdown.getAttribute("aria-label") || "";

  // Check for label element
  if (!label && dropdown.id) {
    const labelElement = document.querySelector(`label[for="${dropdown.id}"]`);
    if (labelElement) {
      label = labelElement.textContent.trim();
    }
  }

  // Check for preceding label-like elements
  if (!label) {
    let currentElement = dropdown.previousElementSibling;
    while (currentElement && !label) {
      if (
        currentElement.tagName === "LABEL" ||
        currentElement.classList.contains("form-label") ||
        currentElement.classList.contains("field-label")
      ) {
        label = currentElement.textContent.trim();
      }
      currentElement = currentElement.previousElementSibling;
    }
  }

  // Check parent elements for text that might be a label
  if (!label) {
    const parent = dropdown.parentElement;
    if (parent) {
      // Get text directly owned by the parent, excluding the dropdown's own text
      const parentNodes = Array.from(parent.childNodes);
      for (const node of parentNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          label = node.textContent.trim();
          break;
        }
      }
    }
  }

  return label;
}
