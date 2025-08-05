// Popup script for handling UI interactions
class PopupManager {
  constructor() {
    try {
      this.extractBtn = document.getElementById("extractBtn");
      this.matchBtn = document.getElementById("matchBtn");
      this.openingsDropdown = document.getElementById("openingsDropdown");
      this.status = document.getElementById("status");
      this.loading = document.getElementById("loading");
      this.dataSection = document.getElementById("dataSection");
      this.extractedData = document.getElementById("extractedData");

      console.log("🔧 PopupManager initialized");
      console.log("📋 Elements found:", {
        extractBtn: !!this.extractBtn,
        matchBtn: !!this.matchBtn,
        openingsDropdown: !!this.openingsDropdown,
        status: !!this.status,
        loading: !!this.loading,
        dataSection: !!this.dataSection,
        extractedData: !!this.extractedData,
      });

      // Check if all required elements are found
      if (!this.extractBtn) {
        console.error("❌ Extract button not found");
      }
      if (!this.matchBtn) {
        console.error("❌ Match button not found");
      }
      if (!this.status) {
        console.error("❌ Status element not found");
      }
      if (!this.dataSection) {
        console.error("❌ Data section not found");
      }
      if (!this.extractedData) {
        console.error("❌ Extracted data element not found");
      }

      // Set global reference immediately
      window.popupManager = this;

      // Bind methods immediately to ensure they're available
      this.extractResumeData = this.extractResumeData.bind(this);
      this.fetchAndPopulateOpenings = this.fetchAndPopulateOpenings.bind(this);
      this.showLoading = this.showLoading.bind(this);
      this.showError = this.showError.bind(this);
      this.showSuccess = this.showSuccess.bind(this);
      this.updateStatus = this.updateStatus.bind(this);
      this.displayExtractedData = this.displayExtractedData.bind(this);
      this.matchWithJD = this.matchWithJD.bind(this);

      this.init();
    } catch (error) {
      console.error("❌ Error in PopupManager constructor:", error);
      throw error;
    }
  }

  init() {
    // Check if we have the minimum required elements
    if (!this.extractBtn || !this.status) {
      console.error("❌ Critical elements missing, cannot initialize popup");
      return;
    }

    // Methods are already bound in constructor

    this.setupEventListeners();
    this.checkCurrentTab();
    this.fetchAndPopulateOpenings();
  }

  setupEventListeners() {
    if (!this.extractBtn) {
      console.error("❌ Extract button not found, cannot add event listener");
      return;
    }
    if (!this.matchBtn) {
      console.error("❌ Match button not found, cannot add event listener");
      return;
    }

    // Global reference is already set in constructor

    this.extractBtn.addEventListener("click", function () {
      console.log("🔘 Extract button clicked");
      console.log("🔍 window.popupManager:", window.popupManager);
      console.log("🔍 typeof window.popupManager:", typeof window.popupManager);
      if (window.popupManager) {
        console.log(
          "🔍 window.popupManager.extractResumeData:",
          typeof window.popupManager.extractResumeData
        );
      }

      if (
        window.popupManager &&
        typeof window.popupManager.extractResumeData === "function"
      ) {
        window.popupManager.extractResumeData();
      } else {
        console.error("❌ PopupManager instance or method not available");
        console.error("🔍 window.popupManager:", window.popupManager);
        console.error(
          "🔍 typeof window.popupManager.extractResumeData:",
          typeof window.popupManager.extractResumeData
        );
      }
    });

    this.matchBtn.addEventListener("click", function () {
      console.log("🔘 Match button clicked");
      if (
        window.popupManager &&
        typeof window.popupManager.matchWithJD === "function"
      ) {
        window.popupManager.matchWithJD();
      } else {
        console.error("❌ PopupManager instance or method not available");
      }
    });
  }

  async checkCurrentTab() {
    try {
      console.log("🔍 Checking current tab...");
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      console.log("📄 Current tab URL:", tab.url);

      if (
        tab.url &&
        (tab.url.includes("naukri.com") ||
          tab.url.includes("resdex.naukri.com"))
      ) {
        this.updateStatus(
          "Ready to extract resume data from Naukri/ResDex",
          "info"
        );
        if (this.extractBtn) {
          this.extractBtn.disabled = false;
        }
        console.log("✅ Tab is valid for extraction");
      } else {
        this.updateStatus("Please navigate to a Naukri profile page", "error");
        if (this.extractBtn) {
          this.extractBtn.disabled = true;
        }
        console.log("❌ Tab is not valid for extraction");
      }
    } catch (error) {
      console.error("❌ Error checking current tab:", error);
      this.updateStatus("Error checking current tab", "error");
    }
  }

  async extractResumeData() {
    // START: Disable buttons during processing
    this.extractBtn.disabled = true;
    this.matchBtn.disabled = true;
    // END: Disable buttons during processing

    this.showLoading();

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        throw new Error("No active tab found");
      }

      console.log("📄 Current tab URL:", tab.url);

      // Check if we're on a Naukri ResDex page
      if (!tab.url.includes("resdex.naukri.com")) {
        this.showError(
          "Please navigate to a Naukri ResDex profile page to extract resume data."
        );
        return;
      }

      console.log("✅ Valid Naukri ResDex page detected");

      // Try to send message to content script
      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, {
          action: "extractResume",
        });
      } catch (error) {
        console.log("⚠️ Content script not ready, attempting to inject...");

        // Try to inject the content script
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });

          // Wait a bit for the script to initialize
          await new Promise(function (resolve) {
            setTimeout(resolve, 1000);
          });

          // Try sending message again
          response = await chrome.tabs.sendMessage(tab.id, {
            action: "extractResume",
          });
        } catch (injectionError) {
          console.error("❌ Failed to inject content script:", injectionError);
          throw new Error("Failed to inject content script");
        }
      }

      console.log("📨 Response received:", response);

      if (response && response.success && response.data) {
        console.log("✅ Data extracted successfully");
        this.displayExtractedData(response.data);
      } else {
        console.error(
          "❌ Extraction failed:",
          response?.error || "Unknown error"
        );
        throw new Error(response?.error || "Failed to extract resume data");
      }
    } catch (error) {
      console.error("❌ Error extracting resume data:", error);
      this.showError("Error extracting resume data: " + error.message);
    } finally {
      // START: Re-enable buttons after processing
      this.extractBtn.disabled = false;
      this.matchBtn.disabled = false;
      // END: Re-enable buttons after processing
    }
  }

  displayExtractedData(data) {
    console.log("🎨 Displaying extracted data in JSON format:", data);

    // Check if required elements exist
    if (!this.dataSection) {
      console.error("❌ Data section element not found");
      return;
    }
    if (!this.extractedData) {
      console.error("❌ Extracted data element not found");
      return;
    }

    this.dataSection.style.display = "block";
    console.log("🎨 Set data section display to block");

    // Display the complete JSON data
    const jsonData = data.modernData || data;
    const formattedJson = JSON.stringify(jsonData, null, 2);

    this.extractedData.textContent = formattedJson;
    console.log("🎨 Displayed JSON data");

    // Setup copy functionality
    this.setupCopyButton(formattedJson);

    console.log("✅ JSON data display completed");
    chrome.storage.local.set({ extractedResumeData: data });
    this.showSuccess("Resume data extracted successfully!");
  }

  // Setup copy button functionality
  setupCopyButton(jsonData) {
    const copyBtn = document.getElementById("copyJsonBtn");
    if (copyBtn) {
      copyBtn.onclick = function () {
        navigator.clipboard
          .writeText(jsonData)
          .then(function () {
            // Temporarily change button text
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "✅ Copied!";
            copyBtn.style.background = "#28a745";

            setTimeout(function () {
              copyBtn.textContent = originalText;
              copyBtn.style.background = "#28a745";
            }, 2000);
          })
          .catch(function (err) {
            console.error("Failed to copy: ", err);
            copyBtn.textContent = "❌ Failed";
            copyBtn.style.background = "#dc3545";

            setTimeout(function () {
              copyBtn.textContent = "📋 Copy JSON";
              copyBtn.style.background = "#28a745";
            }, 2000);
          });
      };
    }
  }

  createDataSection(title, data) {
    console.log("📝 Creating data section:", title, data);
    const section = document.createElement("div");
    section.className = "data-item";

    const titleElement = document.createElement("h4");
    titleElement.textContent = title;
    section.appendChild(titleElement);

    Object.entries(data).forEach(function (entry) {
      const key = entry[0];
      const value = entry[1];
      if (value) {
        const item = document.createElement("p");
        item.innerHTML =
          "<strong>" +
          window.popupManager.capitalizeFirst(key) +
          ":</strong> " +
          value;
        section.appendChild(item);
      }
    });

    return section;
  }

  createListSection(title, items, fields) {
    console.log("📋 Creating list section:", title, items.length, "items");
    const section = document.createElement("div");
    section.className = "data-item";

    const titleElement = document.createElement("h4");
    titleElement.textContent = title + " (" + items.length + ")";
    section.appendChild(titleElement);

    items.forEach(function (item, index) {
      const itemDiv = document.createElement("div");
      itemDiv.style.marginBottom = "8px";
      itemDiv.style.padding = "8px";
      itemDiv.style.backgroundColor = "#f8f9fa";
      itemDiv.style.borderRadius = "4px";

      fields.forEach(function (field) {
        if (item[field]) {
          const fieldElement = document.createElement("p");
          fieldElement.style.margin = "2px 0";
          fieldElement.style.fontSize = "12px";
          fieldElement.innerHTML =
            "<strong>" +
            window.popupManager.capitalizeFirst(field) +
            ":</strong> " +
            item[field];
          itemDiv.appendChild(fieldElement);
        }
      });

      section.appendChild(itemDiv);
    });

    return section;
  }

  createSkillsSection(title, skills) {
    console.log("🛠️ Creating skills section:", title, skills.length, "skills");
    const section = document.createElement("div");
    section.className = "data-item";

    const titleElement = document.createElement("h4");
    titleElement.textContent = title + " (" + skills.length + ")";
    section.appendChild(titleElement);

    const skillsContainer = document.createElement("div");
    skillsContainer.style.display = "flex";
    skillsContainer.style.flexWrap = "wrap";
    skillsContainer.style.gap = "6px";

    skills.forEach(function (skill) {
      const skillTag = document.createElement("span");
      skillTag.textContent = skill;
      skillTag.style.backgroundColor = "#667eea";
      skillTag.style.color = "white";
      skillTag.style.padding = "4px 8px";
      skillTag.style.borderRadius = "12px";
      skillTag.style.fontSize = "11px";
      skillTag.style.fontWeight = "500";
      skillsContainer.appendChild(skillTag);
    });

    section.appendChild(skillsContainer);
    return section;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  updateStatus(message, type) {
    console.log("📊 Status update:", type, message);
    if (!this.status) {
      console.error("❌ Status element not found in updateStatus");
      return;
    }
    this.status.textContent = message;
    this.status.className = "status " + type;
    this.status.style.display = "block";
  }

  showLoading() {
    this.updateStatus("Extracting resume data...", "info");
  }

  showError(message) {
    this.updateStatus(message, "error");
  }

  showSuccess(message) {
    this.updateStatus(message, "success");
  }

  async matchWithJD() {
    // START: Disable buttons to prevent throttling
    this.matchBtn.disabled = true;
    this.extractBtn.disabled = true;
    // END: Disable buttons

    this.updateStatus('Generating screening report...', 'info');
    console.log("🎯 Match JD button clicked, starting POST request process...");

    try {
      // 1. Get Opening ID from dropdown
      const openingId = this.openingsDropdown.value;
      if (!openingId) {
        this.showError('Please select a job description first.');
        console.error("❌ No opening ID selected.");
        return; // Return here because finally block will still run
      }
      console.log("✅ Opening ID selected:", openingId);

      // 2. Get CV Text from local storage
      const storageResult = await chrome.storage.local.get(['extractedResumeData']);
      const resumeData = storageResult.extractedResumeData;
      if (!resumeData) {
        this.showError('Please extract resume data first.');
        console.error("❌ No resume data found in storage.");
        return; // Return here because finally block will still run
      }
      console.log("✅ Found resume data in storage.");

      // START: Corrected request body to match Postman
      // 3. Prepare the request body
      const requestBody = {
        opening_id: openingId, // Changed key to 'opening_id' to match the server's expectation.
        cvtext: resumeData
      };
      // END: Corrected request body

      // 4. Define fetch options for the POST request
      const apiEndpoint = 'https://xpo-ats.onrender.com/api/extension/generateScreeningReport';
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      };

      console.log("🔍 Sending POST request to:", apiEndpoint);

      // 5. Perform the API call
      const response = await fetch(apiEndpoint, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Could not parse error response.' }));
        throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const reportData = await response.json();
      console.log("✅ Report data received:", reportData);

      // 6. Handle the response
      if (reportData && reportData.webViewLink) {
        chrome.tabs.create({ url: reportData.webViewLink });
        this.showSuccess('Screening report opened in a new tab!');
      } else {
        throw new Error('API response did not include a webViewLink.');
      }
    } catch (error) {
      console.error("❌ Failed to generate screening report:", error);
      this.showError(`Error: ${error.message}`);
    } finally {
      // START: Re-enable buttons in the finally block
      // This ensures they are always re-enabled, even if an error occurs.
      this.matchBtn.disabled = false;
      this.extractBtn.disabled = false;
      // END: Re-enable buttons
    }
  }

  async fetchAndPopulateOpenings() {
    console.log("🔍 Fetching job openings...");
    try {
      const response = await fetch('https://xpo-ats.onrender.com/api/extension/fetchOpenings');
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const openings = await response.json();
      this.openingsDropdown.innerHTML = ''; // Clear "Loading..." message

      // Add a default, non-selectable option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select a Job Description";
      this.openingsDropdown.appendChild(defaultOption);

      // Populate dropdown with openings from the API
      openings.forEach(opening => {
        const option = document.createElement('option');
        option.value = opening.openingId; // Use the openingId field for the value
        option.textContent = opening.title.trim(); // Display the title
        this.openingsDropdown.appendChild(option);
      });

    } catch (error) {
      console.error("❌ Failed to fetch openings:", error);
      this.openingsDropdown.innerHTML = `<option value="">Failed to load JDs</option>`;
      this.updateStatus("Could not fetch job openings.", "error");
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Popup DOM loaded, initializing PopupManager");

  // Double-check that all required elements exist
  const requiredElements = [
    "extractBtn",
    "matchBtn",
    "status",
    "dataSection",
    "extractedData",
    "openingsDropdown"
  ];
  const missingElements = requiredElements.filter(function (id) {
    return !document.getElementById(id);
  });

  if (missingElements.length > 0) {
    console.error("❌ Missing required elements:", missingElements);
    return;
  }

  try {
    const popupManager = new PopupManager();
    console.log("✅ PopupManager created successfully:", popupManager);
  } catch (error) {
    console.error("❌ Failed to create PopupManager:", error);
  }
});