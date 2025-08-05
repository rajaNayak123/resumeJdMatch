// Background script for handling extension lifecycle and message passing
class BackgroundManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupMessageListeners();
    this.setupInstallListener();
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case "resumeDataExtracted":
          this.handleResumeDataExtracted(request.data);
          break;
        case "getStoredData":
          this.getStoredData(sendResponse);
          return true; // Keep message channel open for async response
        default:
          console.log("Unknown action:", request.action);
      }
    });
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === "install") {
        console.log("Resume JD Matcher extension installed");
        this.showWelcomeMessage();
      } else if (details.reason === "update") {
        console.log("Resume JD Matcher extension updated");
      }
    });
  }

  handleResumeDataExtracted(data) {
    // Store the extracted data
    chrome.storage.local.set(
      {
        extractedResumeData: data,
        lastExtracted: new Date().toISOString(),
      },
      () => {
        console.log("Resume data stored successfully");
      }
    );

    // You can add additional processing here later
    // For example, sending data to AI API for JD matching
  }

  getStoredData(sendResponse) {
    chrome.storage.local.get(
      ["extractedResumeData", "lastExtracted"],
      (result) => {
        sendResponse({
          success: true,
          data: result.extractedResumeData,
          lastExtracted: result.lastExtracted,
        });
      }
    );
  }

  showWelcomeMessage() {
    // Create a notification or badge to welcome the user
    chrome.action.setBadgeText({ text: "NEW" });
    chrome.action.setBadgeBackgroundColor({ color: "#667eea" });

    // Remove badge after 5 seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 5000);
  }
}

// Initialize background manager
new BackgroundManager();
