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

  // Handle location-related questions in dropdowns
  handleLocationRelatedQuestions();

  // Handle technology experience questions
  handleTechnologyExperienceFields(profile);

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

// Add this function to content.js

function handleLocationRelatedQuestions() {
  // Find all dropdown selects
  const selectElements = document.querySelectorAll("select");

  selectElements.forEach((select) => {
    // Get the label or preceding text for context
    const context = getContextForElement(select);

    if (!context) return;

    // Check if it's asking about comfort with a location
    if (context.includes("comfortable") && context.includes("position")) {
      // Parse the location from the question
      const locationMatch = context.match(/based in ([^\.]+)/i);
      const questionLocation = locationMatch ? locationMatch[1].trim() : "";

      // If we have a location preference and it's mentioned in the question
      chrome.storage.sync.get(["profiles", "activeProfileId"], (data) => {
        const activeProfile = data.profiles.find(
          (p) => p.id === data.activeProfileId
        );

        if (activeProfile && activeProfile.personalInfo.locationPreference) {
          const preference =
            activeProfile.personalInfo.locationPreference.toLowerCase();

          // If the preference contains or matches the location in question, select "Yes"
          if (
            questionLocation &&
            (preference.includes(questionLocation.toLowerCase()) ||
              questionLocation.toLowerCase().includes(preference))
          ) {
            selectYesOption(select);
          } else {
            // Otherwise, make a decision based on whether you'd be willing to relocate
            // For now, let's select "Yes" as a default for this use case
            selectYesOption(select);
          }
        } else {
          // Default to "Yes" if no preference is specified
          selectYesOption(select);
        }
      });
    }
  });
}

function getContextForElement(element) {
  // Try to find text near the element to understand what it's asking
  let context = "";

  // Check for a label
  const labelElement = document.querySelector(`label[for="${element.id}"]`);
  if (labelElement) {
    context = labelElement.textContent.trim();
  }

  // Check for preceding paragraph or heading elements
  if (!context) {
    const prevElements = [];
    let currentEl = element.previousElementSibling;

    // Collect up to 3 previous elements
    while (currentEl && prevElements.length < 3) {
      if (
        [
          "P",
          "H1",
          "H2",
          "H3",
          "H4",
          "H5",
          "H6",
          "LABEL",
          "DIV",
          "SPAN",
        ].includes(currentEl.tagName)
      ) {
        prevElements.push(currentEl.textContent.trim());
      }
      currentEl = currentEl.previousElementSibling;
    }

    if (prevElements.length > 0) {
      context = prevElements.join(" ");
    }
  }

  // Check the parent element's text, but exclude the text from the select itself
  if (!context && element.parentElement) {
    const parentText = Array.from(element.parentElement.childNodes)
      .filter((node) => node !== element && node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(" ");

    if (parentText) {
      context = parentText;
    }
  }

  // If we still don't have context, get any nearby text
  if (!context) {
    // Get all text within 100px proximity
    const rect = element.getBoundingClientRect();
    const nearbyElements = document.elementsFromPoint(rect.left, rect.top - 30);

    for (const nearby of nearbyElements) {
      if (
        nearby !== element &&
        ["P", "LABEL", "DIV", "SPAN", "H1", "H2", "H3", "H4"].includes(
          nearby.tagName
        )
      ) {
        context = nearby.textContent.trim();
        if (context) break;
      }
    }
  }

  return context;
}

function selectYesOption(selectElement) {
  // Try to find and select a "Yes" option
  for (const option of selectElement.options) {
    if (option.text.toLowerCase() === "yes") {
      selectElement.value = option.value;
      selectElement.dispatchEvent(new Event("change", { bubbles: true }));
      console.log('Selected "Yes" for location comfort question');
      return true;
    }
  }

  // If no "Yes" option, select the first non-empty option (assuming it's a Yes/No or similar)
  if (selectElement.options.length > 1) {
    for (const option of selectElement.options) {
      if (
        option.value &&
        option.value !== "" &&
        !option.disabled &&
        option.text !== "Select an option"
      ) {
        selectElement.value = option.value;
        selectElement.dispatchEvent(new Event("change", { bubbles: true }));
        console.log(
          `Selected first valid option: "${option.text}" for location question`
        );
        return true;
      }
    }
  }

  return false;
}

function handleTechnologyExperienceFields(profile) {
  const inputFields = document.querySelectorAll(
    'input[type="text"], input[type="number"], input:not([type])'
  );

  inputFields.forEach((field) => {
    // Skip if already filled
    if (field.value && field.value.length > 0) return;

    const fieldContext = getContextForElement(field);
    if (!fieldContext) return;

    // Check for technology experience questions
    if (fieldContext.includes("experience") && fieldContext.includes("with")) {
      // Extract the technology name
      const technologyMatch = fieldContext.match(/with\s+([^?\.]+)/i);
      if (!technologyMatch) return;

      const technology = technologyMatch[1].trim().toLowerCase();

      // Map common technologies to experience values
      const techExperience = getTechnologyExperience(technology, profile);

      if (techExperience) {
        field.value = techExperience;
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
        console.log(
          `Filled technology experience for ${technology}: ${techExperience}`
        );
      }
    }
  });

  // Handle radio button-based questions
  handleEducationRadioButtons(profile);
}

// Function to determine experience with different technologies
function getTechnologyExperience(technology, profile) {
  // Default to overall experience if specific not found
  const defaultExperience = profile.personalInfo.overallExperience || "3";

  // First check if we have this skill in the profile
  if (profile.skills && profile.skills.length > 0) {
    // Normalize the technology name for comparison
    const normalizedTech = technology.toLowerCase().trim();

    // Look for exact matches first
    const exactMatch = profile.skills.find(
      (skill) => skill.name.toLowerCase() === normalizedTech
    );

    if (exactMatch) {
      return exactMatch.years;
    }

    // Then look for partial matches
    const partialMatch = profile.skills.find(
      (skill) =>
        skill.name.toLowerCase().includes(normalizedTech) ||
        normalizedTech.includes(skill.name.toLowerCase())
    );

    if (partialMatch) {
      return partialMatch.years;
    }
  }

  // If not found in skills, use our technology map
  const techMap = {
    // Front-end technologies
    javascript: "3",
    js: "3",
    typescript: "2",
    ts: "2",
    react: "2",
    angular: "1",
    vue: "1",
    html: "3",
    css: "3",
    sass: "2",
    less: "1",
    bootstrap: "2",
    tailwind: "1",
    material: "1",
    "angular material": "1",

    // Back-end technologies
    node: "2",
    "node.js": "2",
    express: "2",
    python: "1",
    java: "1",
    "c#": "1",
    ".net": "1",
    php: "1",

    // Databases
    sql: "2",
    mysql: "2",
    postgresql: "1",
    mongodb: "2",
    firebase: "1",

    // Tools & others
    git: "3",
    docker: "1",
    kubernetes: "0",
    aws: "1",
    azure: "0",
    "ci/cd": "1",
  };

  // Check for exact matches
  if (techMap[technology]) {
    return techMap[technology];
  }

  // Check for partial matches
  for (const [tech, exp] of Object.entries(techMap)) {
    if (technology.includes(tech) || tech.includes(technology)) {
      return exp;
    }
  }

  // Return default experience if no match found
  return defaultExperience;
}

// Function to handle education-related radio buttons
function handleEducationRadioButtons(profile) {
  // Find groups of radio buttons
  const radioGroups = {};

  // Collect all radio buttons and group them by name
  document.querySelectorAll('input[type="radio"]').forEach((radio) => {
    if (radio.name) {
      if (!radioGroups[radio.name]) {
        radioGroups[radio.name] = [];
      }
      radioGroups[radio.name].push(radio);
    }
  });

  // Process each radio group
  for (const [name, radios] of Object.entries(radioGroups)) {
    // Skip if any in the group is already checked
    if (radios.some((r) => r.checked)) continue;

    // Get context for the radio group
    const context = getContextForRadioGroup(radios);

    if (
      context.includes("bachelor") ||
      context.includes("degree") ||
      context.includes("education") ||
      context.includes("completed")
    ) {
      // Check if user has education entries
      const hasEducation = profile.education && profile.education.length > 0;

      // Find "Yes" option
      const yesOption = radios.find(
        (r) =>
          r.value.toLowerCase() === "yes" ||
          getRadioLabel(r).toLowerCase() === "yes"
      );

      // Find "No" option
      const noOption = radios.find(
        (r) =>
          r.value.toLowerCase() === "no" ||
          getRadioLabel(r).toLowerCase() === "no"
      );

      if (hasEducation && yesOption) {
        yesOption.checked = true;
        yesOption.dispatchEvent(new Event("change", { bubbles: true }));
        console.log('Selected "Yes" for education question');
      } else if (!hasEducation && noOption) {
        noOption.checked = true;
        noOption.dispatchEvent(new Event("change", { bubbles: true }));
        console.log('Selected "No" for education question');
      }
    }

    // Handle notice period questions
    if (
      context.includes("notice period") ||
      context.includes("serving notice")
    ) {
      // Default to Yes for notice period
      const yesOption = radios.find(
        (r) =>
          r.value.toLowerCase() === "yes" ||
          getRadioLabel(r).toLowerCase() === "yes"
      );

      if (yesOption) {
        yesOption.checked = true;
        yesOption.dispatchEvent(new Event("change", { bubbles: true }));
        console.log('Selected "Yes" for notice period question');
      }
    }
  }
}

// Get context for radio group
function getContextForRadioGroup(radios) {
  if (!radios || radios.length === 0) return "";

  // Try to find a heading or label near the first radio
  const firstRadio = radios[0];

  // Check if the radios are in a fieldset with legend
  const fieldset = firstRadio.closest("fieldset");
  if (fieldset) {
    const legend = fieldset.querySelector("legend");
    if (legend) {
      return legend.textContent.trim().toLowerCase();
    }
  }

  // Look for nearby headings
  const radioRect = firstRadio.getBoundingClientRect();
  const headings = document.querySelectorAll(
    "h1, h2, h3, h4, h5, h6, p, label, div"
  );

  let closestHeading = null;
  let closestDistance = Infinity;

  headings.forEach((heading) => {
    const headingRect = heading.getBoundingClientRect();

    // Consider headings above or to the left of the radio
    if (
      headingRect.bottom <= radioRect.top + 50 ||
      headingRect.right <= radioRect.left
    ) {
      const distance =
        Math.abs(headingRect.bottom - radioRect.top) +
        Math.abs(headingRect.right - radioRect.left);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestHeading = heading;
      }
    }
  });

  if (closestHeading && closestDistance < 200) {
    return closestHeading.textContent.trim().toLowerCase();
  }

  // If no heading found, try to get context from parent elements
  return getContextForElement(firstRadio);
}

// Get label for a radio button
function getRadioLabel(radio) {
  // Try to find the label element
  const id = radio.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) {
      return label.textContent.trim();
    }
  }

  // Check if radio is inside a label
  const parentLabel = radio.closest("label");
  if (parentLabel) {
    // Get text excluding the radio button
    const labelText = Array.from(parentLabel.childNodes)
      .filter((node) => node !== radio && node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(" ");

    if (labelText) {
      return labelText;
    }
  }

  // Check siblings
  let sibling = radio.nextElementSibling;
  if (sibling && ["LABEL", "SPAN", "DIV"].includes(sibling.tagName)) {
    return sibling.textContent.trim();
  }

  return "";
}
