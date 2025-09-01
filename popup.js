// Popup script for handling UI interactions
class PopupManager {
  constructor() {
    try {
      this.matchBtn = document.getElementById("matchBtn");
      this.openingsDropdown = document.getElementById("openingsDropdown");
      this.retryBtn = document.getElementById("retryBtn");
      this.status = document.getElementById("status");
      this.loading = document.getElementById("loading");
      this.dataSection = document.getElementById("dataSection");
      this.extractedData = document.getElementById("extractedData");

      console.log("🔧 PopupManager initialized");
      console.log("📋 Elements found:", {
        matchBtn: !!this.matchBtn,
        openingsDropdown: !!this.openingsDropdown,
        status: !!this.status,
        loading: !!this.loading,
        dataSection: !!this.dataSection,
        extractedData: !!this.extractedData,
      });

      // Check if all required elements are found
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
    console.log("🚀 Initializing PopupManager...");
    
    // Check if we have the minimum required elements
    if (!this.status) {
      console.error("❌ Critical elements missing, cannot initialize popup");
      return;
    }

    console.log("✅ Required elements found, proceeding with initialization");

    // Methods are already bound in constructor

    console.log("🔧 Setting up event listeners...");
    this.setupEventListeners();
    
    console.log("🔍 Checking current tab...");
    this.checkCurrentTab();
    
    console.log("📋 Fetching and populating job openings...");
    this.fetchAndPopulateOpenings();
    
    console.log("🔄 Auto-extracting resume data...");
    // Auto-extract resume data when popup opens
    this.autoExtractResumeData();
    
    console.log("✅ PopupManager initialization completed");
  }

  setupEventListeners() {
    if (!this.matchBtn) {
      console.error("❌ Match button not found, cannot add event listener");
      return;
    }

    // Global reference is already set in constructor

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

    // Add retry button event listener
    if (this.retryBtn) {
      this.retryBtn.addEventListener("click", () => {
        console.log("🔄 Retry button clicked");
        this.updateStatus("Retrying to fetch job descriptions...", "info");
        this.fetchAndPopulateOpenings();
      });
    }
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
        this.updateStatus("Ready to match resume with job description", "info");
        console.log("✅ Tab is valid for extraction");
      } else {
        this.updateStatus("Please navigate to a Naukri profile page", "error");
        console.log("❌ Tab is not valid for extraction");
      }
    } catch (error) {
      console.error("❌ Error checking current tab:", error);
      this.updateStatus("Error checking current tab", "error");
    }
  }

  async extractResumeData() {
    // START: Disable buttons during processing
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
      this.matchBtn.disabled = false;
      // END: Re-enable buttons after processing
    }
  }

  async autoExtractResumeData() {
    try {
      console.log("🚀 Auto-extracting resume data...");

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        console.log("❌ No active tab found for auto-extraction");
        return;
      }

      if (!tab.url || !tab.url.includes("resdex.naukri.com")) {
        console.log("❌ Not on a supported page, skipping auto-extraction");
        return;
      }

      console.log("✅ Valid Naukri ResDex page detected, starting auto-extraction");

      let response;
      try {
        // First attempt to send the message
        response = await chrome.tabs.sendMessage(tab.id, {
          action: "extractResume",
        });
      } catch (error) {
        // If content script isn't there, inject it and retry.
        if (error.message.includes("Receiving end does not exist")) {
          console.log("⚠️ Content script not ready, attempting to inject...");

          // Inject the content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });

          // Wait a moment for the script to load and initialize its listener
          await new Promise(resolve => setTimeout(resolve, 500));

          // Retry sending the message
          console.log("🔄 Retrying message to content script...");
          response = await chrome.tabs.sendMessage(tab.id, {
            action: "extractResume",
          });
        } else {
          // For other errors, re-throw them to be caught by the outer block
          throw error;
        }
      }

      // Process the response from either the first or second attempt
      if (response && response.success) {
        console.log("✅ Auto-extraction successful");
        chrome.storage.local.set({ extractedResumeData: response.data });
        this.updateStatus("Resume data extracted automatically", "success");
      } else {
        console.log("❌ Auto-extraction failed:", response?.error || "No data returned.");
      }
    } catch (error) {
      // The outer catch handles failures from injection or the second message attempt
      console.error("❌ Error in auto-extraction process:", error);
      // Fail silently for the user, as per the original design.
    }
  }

  displayExtractedData(data) {
    console.log("🎨 Data extracted successfully (hidden from user)");

    // Store the data without displaying it
    chrome.storage.local.set({ extractedResumeData: data });

    // Update status to show extraction was successful
    this.updateStatus("Resume data extracted successfully", "success");

    console.log("✅ Data stored and ready for matching");
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
    // --- START: ADDED URL CHECK ---
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url || !tab.url.includes("resdex.naukri.com")) {
      this.showError("You must be on a Naukri ResDex page to run a match.");
      return;
    }
    // --- END: ADDED URL CHECK ---

    this.matchBtn.disabled = true;
    this.updateStatus("Generating screening report...", "info");
    console.log("🎯 Match JD button clicked, starting POST request process...");

    try {
      // 1. Get Opening ID from dropdown
      const opening_id = this.openingsDropdown.value;
      if (!opening_id) {
        this.showError("Please select a job description first.");
        return;
      }
      console.log("✅ Opening ID selected:", opening_id);

      // 2. Get CV Text from local storage
      const storageResult = await chrome.storage.local.get([
        "extractedResumeData",
      ]);
      const resumeData = storageResult.extractedResumeData;
      if (!resumeData) {
        this.showError("Please extract resume data first.");
        return;
      }
      
      // --- FIX: Add a check for the modernData property to ensure data integrity ---
      if (!resumeData.modernData) {
        this.showError("Extracted data is invalid. Please try opening the resume again.");
        console.error("Missing 'modernData' in the stored resume object:", resumeData);
        return;
      }

      console.log("✅ Found resume data in storage.");

      const requestBody = {
        opening_id: opening_id,
        candidate: resumeData.modernData, // FIX: Changed 'resumeData' to 'candidate'
        cleanedResumeHtml: resumeData.cleanedResumeHtml
      };
      
      console.log("DEBUG: Request Body Sent to API:", requestBody);

      // 4. Define fetch options for the POST request
      const apiEndpoint =
        "https://xpo-ats.onrender.com/api/extension/generateScreeningReport";
      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      };

      console.log("🔍 Sending POST request to:", apiEndpoint);

      // 5. Perform the API call
      const response = await fetch(apiEndpoint, fetchOptions);

      if (!response.ok) {
        let errorBody;
        try {
            // Try to parse the error response as JSON
            errorBody = await response.json();
            // --- FIX: Log the object correctly for detailed debugging ---
            console.error("Server Error Response Body (JSON):", JSON.stringify(errorBody, null, 2));
        } catch (e) {
            // If it's not JSON, get it as plain text
            errorBody = await response.text();
            console.error("Server Error Response (Text):", errorBody);
        }
        // Use the detailed message from the body if available
        const errorMessage = errorBody?.message || (typeof errorBody === 'string' ? errorBody : response.statusText);
        throw new Error(`API Error: ${response.status} - ${errorMessage}`);
      }
      // ---

      const reportData = await response.json();
      console.log("✅ Report data received:", reportData);

      // 6. Handle the response
      if (reportData && reportData.webViewLink) {
        chrome.tabs.create({ url: reportData.webViewLink });
        this.showSuccess("Screening report opened in a new tab!");
      } else {
        throw new Error("API response did not include a webViewLink.");
      }
    } catch (error) {
      console.error("❌ Failed to generate screening report:", error);
      this.showError(`Error: ${error.message}`);
    } finally {
      this.matchBtn.disabled = false;
    }
  }

  async fetchAndPopulateOpenings() {
    console.log("🔍 Fetching job openings...");
    
    if (!this.openingsDropdown) {
      console.error("❌ Openings dropdown element not found");
      return;
    }
    
    try {
      console.log("🌐 Making API request to fetch openings...");
      
      const response = await fetch(
        "https://xpo-ats.onrender.com/api/extension/fetchOpenings",
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );
      
      console.log("📡 API response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const openings = await response.json();
      console.log("📋 Received openings data:", openings);
      
      this.openingsDropdown.innerHTML = "";
      console.log("🧹 Cleared dropdown content");

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select a Job Description";
      this.openingsDropdown.appendChild(defaultOption);
      console.log("➕ Added default option");

      if (openings && Array.isArray(openings)) {
        openings.forEach((opening, index) => {
          const option = document.createElement("option");
          option.value = opening.openingId || opening.id || index;
          option.textContent = opening.title || opening.jobTitle || opening.name || `Job ${index + 1}`;
          this.openingsDropdown.appendChild(option);
          console.log(`➕ Added option: ${option.textContent} (${option.value})`);
        });
        console.log(`✅ Successfully populated ${openings.length} job openings`);
      } else {
        console.warn("⚠️ Openings data is not an array:", openings);
        this.openingsDropdown.innerHTML = `<option value="">No job openings available</option>`;
      }
      
      if (this.retryBtn) {
        this.retryBtn.style.display = "none";
      }
    } catch (error) {
      console.error("❌ Failed to fetch openings:", error);
      
      if (error.name === 'AbortError') {
        console.error("⏰ Request timed out after 10 seconds");
        this.openingsDropdown.innerHTML = `<option value="">Request timed out</option>`;
        this.updateStatus("API request timed out. Please try again.", "error");
      } else if (error.message.includes('Failed to fetch')) {
        console.error("🌐 Network error - API might be down");
        this.openingsDropdown.innerHTML = `<option value="">API unavailable</option>`;
        this.updateStatus("API is currently unavailable. Please try again later.", "error");
      } else {
        console.error("❌ Other error:", error.message);
        this.openingsDropdown.innerHTML = `<option value="">Failed to load JDs</option>`;
        this.updateStatus("Could not fetch job openings.", "error");
      }
      
      if (this.retryBtn) {
        this.retryBtn.style.display = "block";
      }
      
      console.log("🔄 You can try refreshing the popup to retry");
    }
  }
} 

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Popup DOM loaded, initializing PopupManager");

  setTimeout(() => {
    const requiredElements = [
      "matchBtn",
      "status",
      "dataSection",
      "extractedData",
      "openingsDropdown",
    ];
    const missingElements = requiredElements.filter(function (id) {
      return !document.getElementById(id);
    });

    if (missingElements.length > 0) {
      console.error("❌ Missing required elements:", missingElements);
      console.error("🔍 Available elements:", Array.from(document.querySelectorAll('[id]')).map(el => el.id));
      return;
    }

    console.log("✅ All required elements found, creating PopupManager");

    try {
      const popupManager = new PopupManager();
      console.log("✅ PopupManager created successfully:", popupManager);
    } catch (error) {
      console.error("❌ Failed to create PopupManager:", error);
    }
  }, 100);
});