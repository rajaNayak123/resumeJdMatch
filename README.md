# ResumeMatch - Chrome Extension

A powerful Chrome extension for extracting resume data from Naukri profiles and matching it with job descriptions using AI.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technical Details](#technical-details)
- [API Integration](#api-integration)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

ResumeMatch is a Chrome extension designed to streamline the recruitment process by automatically extracting comprehensive resume data from Naukri.com profiles and matching it with job descriptions. The extension uses advanced web scraping techniques and AI-powered matching to help recruiters and HR professionals make better hiring decisions.

### Key Benefits

- **Automated Data Extraction**: Extract structured resume data from Naukri profiles
- **AI-Powered Matching**: Match candidate profiles with job descriptions
- **Structured Output**: Get clean, organized JSON data for further processing
- **User-Friendly Interface**: Simple popup interface for easy interaction
- **Real-time Processing**: Instant extraction and matching capabilities

## ✨ Features

### 🔍 Resume Data Extraction

- **Profile Information**: Name, headline, location, contact details
- **Work Experience**: Job titles, companies, durations, descriptions
- **Education**: Degrees, institutions, years, specializations
- **Skills**: Technical skills, soft skills, certifications
- **Projects**: Project details, technologies used, outcomes
- **Achievements**: Awards, certifications, notable accomplishments
- **Personal Details**: Work authorization, desired job details

### 🎯 Job Description Matching

- **AI-Powered Analysis**: Intelligent matching using external API
- **Skill Comparison**: Match candidate skills with job requirements
- **Experience Alignment**: Compare work experience with job needs
- **Compatibility Scoring**: Get percentage match scores

### 🎨 User Interface

- **Modern Design**: Clean, gradient-based UI with smooth animations
- **Responsive Layout**: Optimized for extension popup dimensions
- **Status Indicators**: Real-time feedback on extraction progress
- **Data Visualization**: Structured display of extracted information
- **Copy Functionality**: Easy JSON export for further use

## 🚀 Installation

### For Users

1. **Download the Extension**

   ```bash
   git clone https://github.com/yourusername/resume-jd-matcher.git
   cd resume-jd-matcher
   ```

2. **Load in Chrome**

   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the project folder
   - The extension icon should appear in your toolbar

3. **Verify Installation**
   - Click the extension icon to open the popup
   - You should see the "Resume JD Matcher" interface

### For Developers

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/resume-jd-matcher.git
   cd resume-jd-matcher
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Load in Chrome**
   - Follow the same steps as above for loading the extension

## 📖 Usage

### Basic Workflow

1. **Navigate to Naukri Profile**

   - Go to any candidate profile on Naukri.com
   - Ensure the profile page is fully loaded

2. **Extract Resume Data**

   - Click the ResumeMatch extension icon
   - Click "📄 Extract Resume" button
   - Wait for the extraction to complete
   - View the structured data in the popup

3. **Match with Job Description**
   - Select a job description from the dropdown
   - Click "🎯 Match JD" button
   - Review the matching results and scores

### Advanced Features

- **Data Export**: Copy the JSON data for use in other systems
- **Multiple Profiles**: Extract data from different candidate profiles
- **Batch Processing**: Process multiple profiles sequentially

## 📁 Project Structure

```
ResumeMatch/
├── manifest.json          # Extension configuration
├── package.json           # Project metadata and scripts
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality and UI logic
├── content.js            # Content script for data extraction
├── background.js         # Background service worker
└── icons/                # Extension icons
    ├── icon16.png        # 16x16 icon
    ├── icon48.png        # 48x48 icon
    └── icon128.png       # 128x128 icon
```

### File Descriptions

- **`manifest.json`**: Chrome extension manifest with permissions, content scripts, and configuration
- **`popup.html`**: Main user interface with modern CSS styling and responsive design
- **`popup.js`**: Handles user interactions, API calls, and data display
- **`content.js`**: Extracts resume data from Naukri.com pages using DOM manipulation
- **`background.js`**: Manages extension lifecycle, storage, and message passing
- **`package.json`**: Project configuration, dependencies, and metadata

## 🔧 Technical Details

### Architecture

The extension follows a modular architecture with clear separation of concerns:

1. **Popup Interface** (`popup.html` + `popup.js`)

   - User interaction handling
   - API communication
   - Data visualization

2. **Content Script** (`content.js`)

   - DOM manipulation and data extraction
   - Profile parsing logic
   - Data structure creation

3. **Background Script** (`background.js`)
   - Extension lifecycle management
   - Data storage and retrieval
   - Message passing coordination

### Data Extraction Process

1. **Page Analysis**: Detects Naukri profile pages
2. **DOM Parsing**: Extracts structured data from HTML elements
3. **Data Cleaning**: Removes duplicates and formats information
4. **JSON Generation**: Creates organized data structure
5. **Storage**: Saves data locally for future use

### Extracted Data Structure

```json
{
  "profile": {
    "headline": "Software Engineer",
    "keySkills": ["JavaScript", "React", "Node.js"],
    "mayAlsoKnow": ["Python", "MongoDB"]
  },
  "workSummary": {
    "summary": "5+ years of experience...",
    "industry": "Information Technology",
    "department": "Engineering",
    "role": "Software Development"
  },
  "workExperience": [
    {
      "designation": "Senior Software Engineer",
      "duration": "2020 - Present",
      "description": "Led development team..."
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Technology",
      "institution": "University Name",
      "year": "2018"
    }
  ],
  "skills": {
    "technical": ["JavaScript", "React", "Node.js"],
    "certifications": ["AWS Certified Developer"]
  },
  "projects": [
    {
      "title": "E-commerce Platform",
      "description": "Built full-stack application...",
      "technologies": ["React", "Node.js", "MongoDB"]
    }
  ]
}
```

## 🔌 API Integration

### External API Endpoints

The extension integrates with external APIs for enhanced functionality:

- **Job Descriptions API**: `https://xpo-ats.onrender.com/`
- **AI Matching Service**: For intelligent candidate-job matching

### API Usage

```javascript
// Fetch job descriptions
const response = await fetch("https://xpo-ats.onrender.com/api/openings");
const openings = await response.json();

// Match candidate with job
const matchData = {
  candidate: extractedResumeData,
  jobDescription: selectedJob,
};
```

## 🛠️ Development

### Prerequisites

- Node.js >= 14.0.0
- Chrome browser
- Git

### Development Setup

1. **Clone and Install**

   ```bash
   git clone https://github.com/yourusername/resume-jd-matcher.git
   cd resume-jd-matcher
   npm install
   ```

2. **Load Extension**

   - Open Chrome → `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" → Select project folder

3. **Development Workflow**
   - Make changes to source files
   - Reload extension in Chrome
   - Test functionality on Naukri.com

### Available Scripts

```bash
npm run build    # Prepare extension for distribution
npm run dev      # Development mode instructions
npm test         # Run tests (placeholder)
```

### Code Style

- **JavaScript**: ES6+ with modern syntax
- **CSS**: Custom properties and flexbox/grid layouts
- **HTML**: Semantic markup with accessibility considerations
- **Comments**: Comprehensive documentation for complex functions

### Debugging

1. **Extension Debugging**

   - Open Chrome DevTools for popup: Right-click extension icon → Inspect
   - Background script: Go to `chrome://extensions/` → Find extension → "service worker"

2. **Content Script Debugging**
   - Open DevTools on Naukri.com page
   - Check console for extraction logs
   - Use `console.log()` statements for debugging

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Contribution Process

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make Your Changes**
4. **Test Thoroughly**
5. **Submit a Pull Request**

### Development Guidelines

- **Code Quality**: Follow existing code style and patterns
- **Testing**: Test on multiple Naukri profile types
- **Documentation**: Update README for new features
- **Performance**: Ensure fast extraction and minimal memory usage

### Areas for Contribution

- **Enhanced Data Extraction**: Improve parsing accuracy
- **UI/UX Improvements**: Better user experience
- **API Integration**: Additional matching services
- **Performance Optimization**: Faster processing
- **Bug Fixes**: Resolve issues and edge cases

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

1. **Extension Not Loading**

   - Check Chrome version compatibility
   - Verify manifest.json syntax
   - Clear browser cache and reload

2. **Data Extraction Fails**

   - Ensure you're on a Naukri profile page
   - Check if page is fully loaded
   - Verify content script permissions

3. **API Connection Issues**
   - Check internet connection
   - Verify API endpoint availability
   - Review network permissions

### Getting Help

- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check this README and code comments

## 🔮 Roadmap

### Planned Features

- [ ] **Batch Processing**: Extract multiple profiles at once
- [ ] **Export Formats**: PDF, CSV, and Excel export options
- [ ] **Advanced Matching**: Machine learning-based matching
- [ ] **Integration APIs**: Connect with ATS systems
- [ ] **Analytics Dashboard**: Usage statistics and insights
- [ ] **Custom Fields**: User-defined extraction fields
- [ ] **Offline Mode**: Basic functionality without internet
- [ ] **Multi-language Support**: Support for different languages

### Version History

- **v1.0.0**: Initial release with basic extraction and matching
- **Future**: Enhanced features and performance improvements

---

**Made with ❤️ for better recruitment processes**

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/yourusername/resume-jd-matcher).
